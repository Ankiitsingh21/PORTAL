"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerRepository = void 0;
const db_1 = require("../../config/db");
class WorkerRepository {
    findByUserId(userId) {
        return db_1.prisma.workerProfile.findUnique({ where: { userId } });
    }
    findByUserIdFull(userId) {
        return db_1.prisma.workerProfile.findUnique({
            where: { userId },
            include: {
                education: { include: { qualification: true } },
                experience: true,
                skills: { include: { skill: true } },
                languages: { include: { language: true } },
                preferredLocations: { include: { location: true } },
                preferredIndustries: { include: { industry: true } },
            },
        });
    }
    createProfile(userId) {
        return db_1.prisma.workerProfile.create({ data: { userId } });
    }
    updateProfile(userId, data) {
        return db_1.prisma.workerProfile.update({ where: { userId }, data });
    }
    setProfileComplete(userId, complete) {
        return db_1.prisma.workerProfile.update({
            where: { userId },
            data: { profileComplete: complete },
        });
    }
    // ───────────── Junction-table replace helpers ─────────────
    // Each of these replaces the microservices' Int[] soft-ref array with a
    // delete-then-recreate against the real junction table — same "full
    // replace" semantics as before, now FK-enforced.
    replaceSkills(workerId, skillIds) {
        return db_1.prisma.$transaction([
            db_1.prisma.workerSkill.deleteMany({ where: { workerId } }),
            db_1.prisma.workerSkill.createMany({
                data: skillIds.map((skillId) => ({ workerId, skillId })),
            }),
        ]);
    }
    replaceLanguages(workerId, languages) {
        return db_1.prisma.$transaction([
            db_1.prisma.workerLanguage.deleteMany({ where: { workerId } }),
            db_1.prisma.workerLanguage.createMany({
                data: languages.map((l) => ({
                    workerId,
                    languageId: l.languageId,
                    proficiency: l.proficiency,
                })),
            }),
        ]);
    }
    replacePreferredLocations(workerId, locationIds) {
        return db_1.prisma.$transaction([
            db_1.prisma.workerPreferredLocation.deleteMany({ where: { workerId } }),
            db_1.prisma.workerPreferredLocation.createMany({
                data: locationIds.map((locationId) => ({ workerId, locationId })),
            }),
        ]);
    }
    replacePreferredIndustries(workerId, industryIds) {
        return db_1.prisma.$transaction([
            db_1.prisma.workerPreferredIndustry.deleteMany({ where: { workerId } }),
            db_1.prisma.workerPreferredIndustry.createMany({
                data: industryIds.map((industryId) => ({ workerId, industryId })),
            }),
        ]);
    }
    // ───────────── Education ─────────────
    addEducation(workerId, data) {
        return db_1.prisma.workerEducation.create({ data: { workerId, ...data } });
    }
    findEducation(workerId, id) {
        return db_1.prisma.workerEducation.findFirst({ where: { id, workerId } });
    }
    updateEducation(id, data) {
        return db_1.prisma.workerEducation.update({ where: { id }, data });
    }
    deleteEducation(id) {
        return db_1.prisma.workerEducation.delete({ where: { id } });
    }
    // ───────────── Experience ─────────────
    // Concrete type, not Record<string, any> — same reasoning as
    // JobRepository.create: Prisma's WorkerExperienceUncheckedCreateInput
    // requires companyName/jobTitle/fromDate, and a loosely-typed Record
    // doesn't prove those are present even though they always are here.
    addExperience(workerId, data) {
        return db_1.prisma.workerExperience.create({ data: { workerId, ...data } });
    }
    findExperience(workerId, id) {
        return db_1.prisma.workerExperience.findFirst({ where: { id, workerId } });
    }
    updateExperience(id, data) {
        return db_1.prisma.workerExperience.update({ where: { id }, data });
    }
    deleteExperience(id) {
        return db_1.prisma.workerExperience.delete({ where: { id } });
    }
    // ───────────── Recruiter/Admin-facing search ─────────────
    searchWorkers(where) {
        return db_1.prisma.workerProfile.findMany({
            where,
            select: {
                id: true,
                userId: true,
                name: true,
                headline: true,
                city: true,
                totalExperienceMonths: true,
                resumeUrl: true,
                skills: { include: { skill: true } },
            },
        });
    }
    findById(id) {
        return db_1.prisma.workerProfile.findUnique({
            where: { id },
            include: {
                education: { include: { qualification: true } },
                experience: true,
                skills: { include: { skill: true } },
                languages: { include: { language: true } },
            },
        });
    }
    getRecruiterAssignedIndustryIds(recruiterUserId) {
        return db_1.prisma.recruiterCategory.findMany({
            where: { recruiter: { userId: recruiterUserId } },
            select: { industryId: true },
        });
    }
}
exports.WorkerRepository = WorkerRepository;
