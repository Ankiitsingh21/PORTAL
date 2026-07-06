"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkerByUserId = exports.getWorkerById = exports.searchWorkers = exports.deleteExperience = exports.updateExperience = exports.addExperience = exports.deleteEducation = exports.updateEducation = exports.addEducation = exports.updateProfile = exports.getOwnProfile = exports.createProfile = void 0;
const worker_repository_1 = require("./worker.repository");
const errors_1 = require("../../common/errors");
const repo = new worker_repository_1.WorkerRepository();
// ───────────── Profile ─────────────
const createProfile = async (userId) => {
    const existing = await repo.findByUserId(userId);
    if (existing)
        throw new errors_1.BadRequestError("Profile already exists");
    return repo.createProfile(userId);
};
exports.createProfile = createProfile;
const getOwnProfile = async (userId) => {
    const profile = await repo.findByUserIdFull(userId);
    if (!profile)
        throw new errors_1.NotFoundError("Profile not found — create it first");
    return profile;
};
exports.getOwnProfile = getOwnProfile;
// Scalar fields only — the four array fields from the microservices
// version (skillIds, languageIds, preferredLocationIds,
// preferredIndustryIds) are now junction tables and go through the
// dedicated replace* repo methods below instead of a plain column update.
const SCALAR_FIELDS = [
    "name",
    "phone",
    "dob",
    "gender",
    "city",
    "currentLocality",
    "profilePhotoUrl",
    "headline",
    "summary",
    "totalExperienceMonths",
    "expectedSalaryMin",
    "expectedSalaryMax",
    "jobType",
    "availability",
    "resumeUrl",
];
const updateProfile = async (userId, body) => {
    const profile = await repo.findByUserId(userId);
    if (!profile)
        throw new errors_1.NotFoundError("Profile not found — create it first");
    const data = {};
    for (const key of SCALAR_FIELDS) {
        if (body[key] !== undefined)
            data[key] = body[key];
    }
    if (data.dob)
        data.dob = new Date(data.dob);
    if (Object.keys(data).length) {
        await repo.updateProfile(userId, data);
    }
    if (body.skillIds)
        await repo.replaceSkills(profile.id, body.skillIds);
    // API contract note: languageIds (number[]) -> languages
    // ({ languageId, proficiency? }[]) — proficiency is a new optional field
    // on the junction table that didn't exist on the old Int[] column.
    if (body.languages)
        await repo.replaceLanguages(profile.id, body.languages);
    if (body.preferredLocationIds)
        await repo.replacePreferredLocations(profile.id, body.preferredLocationIds);
    if (body.preferredIndustryIds)
        await repo.replacePreferredIndustries(profile.id, body.preferredIndustryIds);
    let updated = await repo.findByUserIdFull(userId);
    const isComplete = !!(updated.name &&
        updated.phone &&
        updated.resumeUrl &&
        updated.skills.length);
    if (isComplete !== updated.profileComplete) {
        await repo.setProfileComplete(userId, isComplete);
        updated = await repo.findByUserIdFull(userId);
    }
    return updated;
};
exports.updateProfile = updateProfile;
// ───────────── Education ─────────────
const addEducation = async (userId, qualificationId, institute, passoutYear, score) => {
    const profile = await repo.findByUserId(userId);
    if (!profile)
        throw new errors_1.NotFoundError("Profile not found — create it first");
    return repo.addEducation(profile.id, {
        qualificationId,
        institute,
        passoutYear,
        score,
    });
};
exports.addEducation = addEducation;
const updateEducation = async (userId, educationId, data) => {
    const profile = await repo.findByUserId(userId);
    if (!profile)
        throw new errors_1.NotFoundError("Profile not found");
    const education = await repo.findEducation(profile.id, educationId);
    if (!education)
        throw new errors_1.NotFoundError("Education entry not found");
    return repo.updateEducation(educationId, data);
};
exports.updateEducation = updateEducation;
const deleteEducation = async (userId, educationId) => {
    const profile = await repo.findByUserId(userId);
    if (!profile)
        throw new errors_1.NotFoundError("Profile not found");
    const education = await repo.findEducation(profile.id, educationId);
    if (!education)
        throw new errors_1.NotFoundError("Education entry not found");
    await repo.deleteEducation(educationId);
    return { deleted: true };
};
exports.deleteEducation = deleteEducation;
// ───────────── Experience ─────────────
const addExperience = async (userId, companyName, jobTitle, fromDate, toDate, isCurrent, description) => {
    const profile = await repo.findByUserId(userId);
    if (!profile)
        throw new errors_1.NotFoundError("Profile not found — create it first");
    return repo.addExperience(profile.id, {
        companyName,
        jobTitle,
        fromDate: new Date(fromDate),
        toDate: toDate ? new Date(toDate) : undefined,
        isCurrent: !!isCurrent,
        description,
    });
};
exports.addExperience = addExperience;
const updateExperience = async (userId, experienceId, data) => {
    const profile = await repo.findByUserId(userId);
    if (!profile)
        throw new errors_1.NotFoundError("Profile not found");
    const experience = await repo.findExperience(profile.id, experienceId);
    if (!experience)
        throw new errors_1.NotFoundError("Experience entry not found");
    if (data.fromDate)
        data.fromDate = new Date(data.fromDate);
    if (data.toDate)
        data.toDate = new Date(data.toDate);
    return repo.updateExperience(experienceId, data);
};
exports.updateExperience = updateExperience;
const deleteExperience = async (userId, experienceId) => {
    const profile = await repo.findByUserId(userId);
    if (!profile)
        throw new errors_1.NotFoundError("Profile not found");
    const experience = await repo.findExperience(profile.id, experienceId);
    if (!experience)
        throw new errors_1.NotFoundError("Experience entry not found");
    await repo.deleteExperience(experienceId);
    return { deleted: true };
};
exports.deleteExperience = deleteExperience;
// ───────────── Recruiter/Admin-facing search ─────────────
// The microservices version explicitly punted on category-gating here:
// "needs the recruiter's assignedCategories from the JWT... we're not
// filtering by that yet — wire this in once Job Service exists and we can
// test the full flow together." Everything's in one DB now, so it's a
// plain join instead of a cross-service round trip. Implemented for real.
const searchWorkers = async (currentUser, filters) => {
    const where = currentUser.role === "super_admin" && filters.completeOnly === false
        ? {}
        : { profileComplete: true };
    if (filters.skillId)
        where.skills = { some: { skillId: filters.skillId } };
    if (filters.city)
        where.city = filters.city;
    if (filters.q) {
        where.OR = [
            { name: { contains: filters.q, mode: "insensitive" } },
            { headline: { contains: filters.q, mode: "insensitive" } },
            {
                skills: {
                    some: {
                        skill: { name: { contains: filters.q, mode: "insensitive" } },
                    },
                },
            },
        ];
    }
    if (currentUser.role === "recruiter") {
        const assigned = await repo.getRecruiterAssignedIndustryIds(currentUser.id);
        const industryIds = assigned.map((a) => a.industryId);
        // A recruiter with zero assigned categories sees zero workers, rather
        // than an unfiltered `in: []` which Prisma/Postgres would otherwise
        // treat as "match nothing" anyway — `-1` just makes that explicit.
        where.preferredIndustries = {
            some: { industryId: { in: industryIds.length ? industryIds : [-1] } },
        };
    }
    return repo.searchWorkers(where);
};
exports.searchWorkers = searchWorkers;
const getWorkerById = async (id) => {
    const worker = await repo.findById(id);
    if (!worker)
        throw new errors_1.NotFoundError("Worker not found");
    return worker;
};
exports.getWorkerById = getWorkerById;
const getWorkerByUserId = async (userId) => {
    const worker = await repo.findByUserIdFull(userId);
    if (!worker)
        throw new errors_1.NotFoundError("Worker not found");
    return worker;
};
exports.getWorkerByUserId = getWorkerByUserId;
