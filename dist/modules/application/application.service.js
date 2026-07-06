"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listByRecruiter = exports.listByJobIds = exports.withdrawApplication = exports.updateStatus = exports.getApplication = exports.listApplicationsForJob = exports.listRecruiterApplications = exports.listAllApplications = exports.listMyApplications = exports.applyToJob = void 0;
const application_repository_1 = require("./application.repository");
const errors_1 = require("../../common/errors");
const jobService = __importStar(require("../job/job.service"));
const email_service_1 = require("../notification/email.service");
const repo = new application_repository_1.ApplicationRepository();
const ALLOWED_TRANSITIONS = {
    applied: ["shortlisted", "rejected"],
    shortlisted: ["interview_scheduled", "rejected"],
    interview_scheduled: ["hired", "rejected"],
    hired: [],
    rejected: [],
};
const applyToJob = async (workerId, jobId, coverNote) => {
    const existing = await repo.findByJobAndWorker(jobId, workerId);
    if (existing)
        throw new errors_1.BadRequestError("You have already applied to this job");
    // Was an axios.get() to Job Service over HTTP — now a direct call into
    // job.service, in the same process, same transaction boundary if needed.
    const job = await jobService.getJob(jobId);
    if (job.status !== "active")
        throw new errors_1.BadRequestError("This job is not accepting applications");
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
exports.applyToJob = applyToJob;
const listMyApplications = (workerId) => repo.listByWorker(workerId);
exports.listMyApplications = listMyApplications;
const listAllApplications = () => repo.listAll();
exports.listAllApplications = listAllApplications;
const listRecruiterApplications = (currentUser) => {
    if (currentUser.role === "super_admin")
        return repo.listAll();
    return repo.listByRecruiter(currentUser.id);
};
exports.listRecruiterApplications = listRecruiterApplications;
const listApplicationsForJob = async (jobId, currentUser) => {
    // Look up the job itself first — this throws NotFoundError if the job
    // doesn't exist, and gives us the real owner (job.postedBy) to check
    // against. Previously this checked ownership against the first
    // *application's* recruiterId, which meant a job with zero applicants
    // skipped the ownership check entirely and returned an empty list to
    // any recruiter, regardless of who actually posted the job.
    const job = await jobService.getJob(jobId);
    if (currentUser.role !== "super_admin" && job.postedBy !== currentUser.id) {
        throw new errors_1.ForbiddenError("You can only view applicants for jobs you posted");
    }
    return repo.listByJob(jobId);
};
exports.listApplicationsForJob = listApplicationsForJob;
const getApplication = async (id, currentUser) => {
    const app = await repo.findById(id);
    if (!app)
        throw new errors_1.NotFoundError("Application not found");
    const isOwnerWorker = app.workerId === currentUser.id;
    const isOwnerRecruiter = app.recruiterId === currentUser.id;
    if (!isOwnerWorker &&
        !isOwnerRecruiter &&
        currentUser.role !== "super_admin") {
        throw new errors_1.ForbiddenError("Not authorized to view this application");
    }
    return app;
};
exports.getApplication = getApplication;
const updateStatus = async (id, currentUser, newStatus, notes) => {
    const app = await repo.findById(id);
    if (!app)
        throw new errors_1.NotFoundError("Application not found");
    if (currentUser.role !== "super_admin" &&
        app.recruiterId !== currentUser.id) {
        throw new errors_1.ForbiddenError("You can only update applications for jobs you posted");
    }
    const allowed = ALLOWED_TRANSITIONS[app.status];
    if (!allowed.includes(newStatus)) {
        throw new errors_1.BadRequestError(`Cannot move application from ${app.status} to ${newStatus}`);
    }
    const updated = await repo.update(id, { status: newStatus });
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
        await (0, email_service_1.sendEmail)(app.worker.email, "Your application status has been updated", `Your application is now: ${newStatus}`);
    }
    return updated;
};
exports.updateStatus = updateStatus;
const withdrawApplication = async (id, workerId) => {
    const app = await repo.findByIdBasic(id);
    if (!app)
        throw new errors_1.NotFoundError("Application not found");
    if (app.workerId !== workerId)
        throw new errors_1.ForbiddenError("Not your application");
    if (app.status !== "applied") {
        throw new errors_1.BadRequestError("Can only withdraw applications still in 'applied' status");
    }
    await repo.delete(id);
    return { withdrawn: true };
};
exports.withdrawApplication = withdrawApplication;
// ───────────── For Admin reporting ─────────────
const listByJobIds = (jobIds) => repo.listByJobIds(jobIds);
exports.listByJobIds = listByJobIds;
const listByRecruiter = (recruiterId) => repo.listByRecruiter(recruiterId);
exports.listByRecruiter = listByRecruiter;
