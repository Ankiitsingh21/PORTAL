"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRecruiterAssignedToIndustry = exports.listJobsByRecruiter = exports.assignJobToRecruiter = exports.deleteJob = exports.updateJobStatus = exports.updateJob = exports.getJobForUser = exports.getJob = exports.listJobs = exports.createJob = void 0;
const job_repository_1 = require("./job.repository");
const errors_1 = require("../../common/errors");
const repo = new job_repository_1.JobRepository();
const ALLOWED_TRANSITIONS = {
    draft: ["active", "closed"],
    active: ["closed"],
    closed: [],
};
const createJob = async (postedBy, body) => {
    const { title, description, responsibilities, requirements, benefits, industryId, functionId, jobRoleId, locationId, wageMin, wageMax, wageType, shiftType, jobType, headcountRequired, minExperienceMonths, skillIds, qualificationIds, } = body;
    return repo.create(postedBy, {
        title,
        description,
        responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
        requirements: Array.isArray(requirements) ? requirements : [],
        benefits: Array.isArray(benefits) ? benefits : [],
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
exports.createJob = createJob;
// Role-aware listing:
// worker -> active jobs only
// recruiter -> only their own posted jobs
// super_admin -> everything
const listJobs = async (role, userId) => {
    if (!role || !userId)
        return repo.listActive();
    if (role === "worker")
        return repo.listActive();
    if (role === "recruiter")
        return repo.listByPoster(userId);
    return repo.listAll();
};
exports.listJobs = listJobs;
const getJob = async (id) => {
    const job = await repo.findById(id);
    if (!job)
        throw new errors_1.NotFoundError("Job not found");
    return job;
};
exports.getJob = getJob;
const getJobForUser = async (id, currentUser) => {
    const job = await (0, exports.getJob)(id);
    if (job.status === "active")
        return job;
    if (currentUser?.role === "super_admin")
        return job;
    if (currentUser?.role === "recruiter" && job.postedBy === currentUser.id) {
        return job;
    }
    throw new errors_1.NotFoundError("Job not found");
};
exports.getJobForUser = getJobForUser;
const assertOwnerOrAdmin = (job, currentUser) => {
    if (currentUser.role === "super_admin")
        return;
    if (job.postedBy !== currentUser.id) {
        throw new errors_1.ForbiddenError("You can only modify jobs you posted");
    }
};
const updateJob = async (id, currentUser, data) => {
    const job = await (0, exports.getJob)(id);
    assertOwnerOrAdmin(job, currentUser);
    return repo.update(id, data);
};
exports.updateJob = updateJob;
const updateJobStatus = async (id, currentUser, newStatus) => {
    const job = await (0, exports.getJob)(id);
    assertOwnerOrAdmin(job, currentUser);
    const allowed = ALLOWED_TRANSITIONS[job.status];
    if (!allowed.includes(newStatus)) {
        throw new errors_1.BadRequestError(`Cannot move job from ${job.status} to ${newStatus}`);
    }
    const updated = await repo.updateStatus(id, newStatus);
    // Worker matching/notifications can be added here when that product flow is ready.
    return updated;
};
exports.updateJobStatus = updateJobStatus;
const deleteJob = async (id, currentUser) => {
    const job = await (0, exports.getJob)(id);
    assertOwnerOrAdmin(job, currentUser);
    if (job.status !== "draft") {
        throw new errors_1.BadRequestError("Only draft jobs can be deleted — close active jobs instead");
    }
    await repo.delete(id);
    return { deleted: true };
};
exports.deleteJob = deleteJob;
const assignJobToRecruiter = async (id, newRecruiterUserId) => {
    await (0, exports.getJob)(id);
    return repo.reassign(id, newRecruiterUserId);
};
exports.assignJobToRecruiter = assignJobToRecruiter;
const listJobsByRecruiter = (postedBy) => repo.listByPoster(postedBy);
exports.listJobsByRecruiter = listJobsByRecruiter;
const isRecruiterAssignedToIndustry = async (recruiterUserId, industryId) => {
    const row = await repo.isRecruiterAssignedToIndustry(recruiterUserId, industryId);
    return !!row;
};
exports.isRecruiterAssignedToIndustry = isRecruiterAssignedToIndustry;
