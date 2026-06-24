import { JobRepository } from "./job.repository";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../common/errors";

const repo = new JobRepository();

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["active", "closed"],
  active: ["closed"],
  closed: [],
};

export const createJob = async (
  postedBy: string,
  body: Record<string, any>,
) => {
  const {
    title,
    description,
    industryId,
    functionId,
    jobRoleId,
    locationId,
    wageMin,
    wageMax,
    wageType,
    shiftType,
    jobType,
    headcountRequired,
    minExperienceMonths,
    skillIds,
    qualificationIds,
  } = body;

  return repo.create(postedBy, {
    title,
    description,
    industryId,
    functionId,
    jobRoleId,
    locationId,
    wageMin,
    wageMax,
    wageType,
    shiftType,
    jobType,
    headcountRequired,
    minExperienceMonths: minExperienceMonths ?? 0,
    skillIds,
    qualificationIds,
  });
};

// Role-aware listing:
// worker -> active jobs only
// recruiter -> only their own posted jobs
// super_admin -> everything
export const listJobs = async (role: string, userId: string) => {
  if (role === "worker") return repo.listActive();
  if (role === "recruiter") return repo.listByPoster(userId);
  return repo.listAll();
};

export const getJob = async (id: string) => {
  const job = await repo.findById(id);
  if (!job) throw new NotFoundError("Job not found");
  return job;
};

const assertOwnerOrAdmin = (
  job: { postedBy: string },
  currentUser: { id: string; role: string },
) => {
  if (currentUser.role === "super_admin") return;
  if (job.postedBy !== currentUser.id) {
    throw new ForbiddenError("You can only modify jobs you posted");
  }
};

export const updateJob = async (
  id: string,
  currentUser: { id: string; role: string },
  data: Record<string, any>,
) => {
  const job = await getJob(id);
  assertOwnerOrAdmin(job, currentUser);
  return repo.update(id, data);
};

export const updateJobStatus = async (
  id: string,
  currentUser: { id: string; role: string },
  newStatus: string,
) => {
  const job = await getJob(id);
  assertOwnerOrAdmin(job, currentUser);

  const allowed = ALLOWED_TRANSITIONS[job.status];
  if (!allowed.includes(newStatus)) {
    throw new BadRequestError(
      `Cannot move job from ${job.status} to ${newStatus}`,
    );
  }

  const updated = await repo.updateStatus(id, newStatus);

  // Same TODO as the microservices version — worker matching by
  // industry/location was never built there either. The difference now is
  // it'd just be a direct query + a sendEmail() call, no event bus needed.
  if (newStatus === "active") {
    console.log(`[DEV ONLY] Job ${id} is now active — batch notify pending`);
  }

  return updated;
};

export const deleteJob = async (
  id: string,
  currentUser: { id: string; role: string },
) => {
  const job = await getJob(id);
  assertOwnerOrAdmin(job, currentUser);

  if (job.status !== "draft") {
    throw new BadRequestError(
      "Only draft jobs can be deleted — close active jobs instead",
    );
  }

  await repo.delete(id);
  return { deleted: true };
};

export const assignJobToRecruiter = async (
  id: string,
  newRecruiterUserId: string,
) => {
  await getJob(id);
  return repo.reassign(id, newRecruiterUserId);
};

export const listJobsByRecruiter = (postedBy: string) =>
  repo.listByPoster(postedBy);

export const isRecruiterAssignedToIndustry = async (
  recruiterUserId: string,
  industryId: number,
) => {
  const row = await repo.isRecruiterAssignedToIndustry(
    recruiterUserId,
    industryId,
  );
  return !!row;
};
