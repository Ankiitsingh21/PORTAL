import { ApplicationRepository } from "./application.repository";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../common/errors";
import * as jobService from "../job/job.service";
import { sendEmail } from "../notification/email.service";

const repo = new ApplicationRepository();

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  applied: ["shortlisted", "rejected"],
  shortlisted: ["interview_scheduled", "rejected"],
  interview_scheduled: ["hired", "rejected"],
  hired: [],
  rejected: [],
};

export const applyToJob = async (
  workerId: string,
  jobId: string,
  coverNote?: string,
) => {
  const existing = await repo.findByJobAndWorker(jobId, workerId);
  if (existing)
    throw new BadRequestError("You have already applied to this job");

  // Was an axios.get() to Job Service over HTTP — now a direct call into
  // job.service, in the same process, same transaction boundary if needed.
  const job = await jobService.getJob(jobId);
  if (job.status !== "active")
    throw new BadRequestError("This job is not accepting applications");

  const application = await repo.create({
    jobId,
    workerId,
    recruiterId: job.postedBy,
    coverNote,
  });
  await repo.addHistory({
    applicationId: application.id,
    toStatus: "applied",
    changedById: workerId,
  });

  return application;
};

export const listMyApplications = (workerId: string) =>
  repo.listByWorker(workerId);

export const listAllApplications = () => repo.listAll();

export const listRecruiterApplications = (
  currentUser: { id: string; role: string },
) => {
  if (currentUser.role === "super_admin") return repo.listAll();
  return repo.listByRecruiter(currentUser.id);
};

export const listApplicationsForJob = async (
  jobId: string,
  currentUser: { id: string; role: string },
) => {
  // Look up the job itself first — this throws NotFoundError if the job
  // doesn't exist, and gives us the real owner (job.postedBy) to check
  // against. Previously this checked ownership against the first
  // *application's* recruiterId, which meant a job with zero applicants
  // skipped the ownership check entirely and returned an empty list to
  // any recruiter, regardless of who actually posted the job.
  const job = await jobService.getJob(jobId);

  if (currentUser.role !== "super_admin" && job.postedBy !== currentUser.id) {
    throw new ForbiddenError(
      "You can only view applicants for jobs you posted",
    );
  }

  return repo.listByJob(jobId);
};

export const getApplication = async (
  id: string,
  currentUser: { id: string; role: string },
) => {
  const app = await repo.findById(id);
  if (!app) throw new NotFoundError("Application not found");

  const isOwnerWorker = app.workerId === currentUser.id;
  const isOwnerRecruiter = app.recruiterId === currentUser.id;
  if (
    !isOwnerWorker &&
    !isOwnerRecruiter &&
    currentUser.role !== "super_admin"
  ) {
    throw new ForbiddenError("Not authorized to view this application");
  }

  return app;
};

export const updateStatus = async (
  id: string,
  currentUser: { id: string; role: string },
  newStatus: string,
  notes?: string,
) => {
  const app = await repo.findById(id);
  if (!app) throw new NotFoundError("Application not found");

  if (
    currentUser.role !== "super_admin" &&
    app.recruiterId !== currentUser.id
  ) {
    throw new ForbiddenError(
      "You can only update applications for jobs you posted",
    );
  }

  const allowed = ALLOWED_TRANSITIONS[app.status];
  if (!allowed.includes(newStatus)) {
    throw new BadRequestError(
      `Cannot move application from ${app.status} to ${newStatus}`,
    );
  }

  const updated = await repo.update(id, { status: newStatus as any });
  await repo.addHistory({
    applicationId: id,
    fromStatus: app.status,
    toStatus: newStatus,
    changedById: currentUser.id,
    notes,
  });

  // The microservices Notification handler had a TODO for exactly this:
  // "fetch worker's email (Auth Service has it, Worker doesn't store it)
  // before this can send a real email — needs one more internal lookup."
  // That lookup is now just `app.worker.email` because Application has a
  // real FK straight to User.
  if (app.worker.email) {
    await sendEmail(
      app.worker.email,
      "Your application status has been updated",
      `Your application is now: ${newStatus}`,
    );
  }

  return updated;
};

export const withdrawApplication = async (id: string, workerId: string) => {
  const app = await repo.findByIdBasic(id);
  if (!app) throw new NotFoundError("Application not found");
  if (app.workerId !== workerId)
    throw new ForbiddenError("Not your application");
  if (app.status !== "applied") {
    throw new BadRequestError(
      "Can only withdraw applications still in 'applied' status",
    );
  }

  await repo.delete(id);
  return { withdrawn: true };
};

// ───────────── For Admin reporting ─────────────
export const listByJobIds = (jobIds: string[]) => repo.listByJobIds(jobIds);
export const listByRecruiter = (recruiterId: string) =>
  repo.listByRecruiter(recruiterId);
