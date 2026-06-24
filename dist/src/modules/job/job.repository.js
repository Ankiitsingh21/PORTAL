"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRepository = void 0;
const db_1 = require("../../config/db");
class JobRepository {
    create(postedBy, data) {
        const { skillIds, qualificationIds, ...rest } = data;
        return db_1.prisma.job.create({
            data: {
                ...rest,
                postedBy,
                skills: skillIds
                    ? { create: skillIds.map((skillId) => ({ skillId })) }
                    : undefined,
                qualifications: qualificationIds
                    ? {
                        create: qualificationIds.map((qualificationId) => ({
                            qualificationId,
                        })),
                    }
                    : undefined,
            },
            include: { skills: true, qualifications: true },
        });
    }
    findById(id) {
        return db_1.prisma.job.findUnique({
            where: { id },
            include: {
                industry: true,
                location: true,
                function: true,
                jobRole: true,
                skills: { include: { skill: true } },
                qualifications: { include: { qualification: true } },
            },
        });
    }
    listActive() {
        return db_1.prisma.job.findMany({
            where: { status: "active" },
            orderBy: { createdAt: "desc" },
        });
    }
    listByPoster(postedBy) {
        return db_1.prisma.job.findMany({
            where: { postedBy },
            orderBy: { createdAt: "desc" },
        });
    }
    listAll() {
        return db_1.prisma.job.findMany({ orderBy: { createdAt: "desc" } });
    }
    update(id, data) {
        return db_1.prisma.job.update({ where: { id }, data });
    }
    updateStatus(id, status) {
        return db_1.prisma.job.update({
            where: { id },
            data: { status: status },
        });
    }
    delete(id) {
        return db_1.prisma.job.delete({ where: { id } });
    }
    reassign(id, postedBy) {
        return db_1.prisma.job.update({ where: { id }, data: { postedBy } });
    }
    // Used by job.middlewares.categoryGuard — replaces the JWT-based
    // `assignedCategories` check from the microservices version with a live
    // join against RecruiterCategory.
    isRecruiterAssignedToIndustry(recruiterUserId, industryId) {
        return db_1.prisma.recruiterCategory.findFirst({
            where: { industryId, recruiter: { userId: recruiterUserId } },
        });
    }
}
exports.JobRepository = JobRepository;
