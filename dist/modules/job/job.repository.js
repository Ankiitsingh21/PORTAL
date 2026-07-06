"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRepository = void 0;
const db_1 = require("../../config/db");
class JobRepository {
    constructor() {
        this.jobListInclude = {
            industry: true,
            location: true,
            function: true,
            jobRole: true,
            poster: {
                select: {
                    id: true,
                    email: true,
                    recruiter: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
            skills: {
                include: {
                    skill: true,
                },
            },
            qualifications: {
                include: {
                    qualification: true,
                },
            },
            _count: {
                select: {
                    applications: true,
                },
            },
        };
    }
    create(postedBy, data) {
        const { skillIds, qualificationIds, ...rest } = data;
        return db_1.prisma.job.create({
            data: {
                ...rest,
                postedBy,
                skills: skillIds
                    ? {
                        create: skillIds.map((skillId) => ({ skillId })),
                    }
                    : undefined,
                qualifications: qualificationIds
                    ? {
                        create: qualificationIds.map((qualificationId) => ({
                            qualificationId,
                        })),
                    }
                    : undefined,
            },
            include: {
                ...this.jobListInclude,
            },
        });
    }
    findById(id) {
        return db_1.prisma.job.findUnique({
            where: { id },
            include: {
                ...this.jobListInclude,
            },
        });
    }
    // ✅ Fixed
    listActive() {
        return db_1.prisma.job.findMany({
            where: { status: "active" },
            orderBy: { createdAt: "desc" },
            include: {
                ...this.jobListInclude,
            },
        });
    }
    // ✅ Fixed
    listByPoster(postedBy) {
        return db_1.prisma.job.findMany({
            where: { postedBy },
            orderBy: { createdAt: "desc" },
            include: {
                ...this.jobListInclude,
            },
        });
    }
    // ✅ Fixed
    listAll() {
        return db_1.prisma.job.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                ...this.jobListInclude,
            },
        });
    }
    update(id, data) {
        return db_1.prisma.job.update({
            where: { id },
            data,
        });
    }
    updateStatus(id, status) {
        return db_1.prisma.job.update({
            where: { id },
            data: {
                status: status,
            },
        });
    }
    delete(id) {
        return db_1.prisma.job.delete({
            where: { id },
        });
    }
    reassign(id, postedBy) {
        return db_1.prisma.job.update({
            where: { id },
            data: {
                postedBy,
            },
        });
    }
    isRecruiterAssignedToIndustry(recruiterUserId, industryId) {
        return db_1.prisma.recruiterCategory.findFirst({
            where: {
                industryId,
                recruiter: {
                    userId: recruiterUserId,
                },
            },
        });
    }
}
exports.JobRepository = JobRepository;
