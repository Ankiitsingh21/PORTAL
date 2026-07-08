"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRepository = void 0;
const db_1 = require("../../config/db");
class AdminRepository {
    async getStats() {
        const [totalRecruiters, activeRecruiters, inactiveRecruiters, totalWorkers, totalJobs, activeJobs, draftJobs, closedJobs, totalApplications, appliedApplications, shortlistedApplications, interviewApplications, hiredApplications, rejectedApplications, industries, locations, skills, jobRoles, languages, qualifications,] = await Promise.all([
            db_1.prisma.recruiter.count(),
            db_1.prisma.recruiter.count({ where: { isActive: true } }),
            db_1.prisma.recruiter.count({ where: { isActive: false } }),
            db_1.prisma.workerProfile.count(),
            db_1.prisma.job.count(),
            db_1.prisma.job.count({ where: { status: "active" } }),
            db_1.prisma.job.count({ where: { status: "draft" } }),
            db_1.prisma.job.count({ where: { status: "closed" } }),
            db_1.prisma.application.count(),
            db_1.prisma.application.count({ where: { status: "applied" } }),
            db_1.prisma.application.count({ where: { status: "shortlisted" } }),
            db_1.prisma.application.count({ where: { status: "interview_scheduled" } }),
            db_1.prisma.application.count({ where: { status: "hired" } }),
            db_1.prisma.application.count({ where: { status: "rejected" } }),
            db_1.prisma.industry.count({ where: { isActive: true } }),
            db_1.prisma.location.count({ where: { isActive: true } }),
            db_1.prisma.skill.count({ where: { isActive: true } }),
            db_1.prisma.jobRole.count({ where: { isActive: true } }),
            db_1.prisma.language.count({ where: { isActive: true } }),
            db_1.prisma.qualification.count({ where: { isActive: true } }),
        ]);
        return {
            totalRecruiters,
            activeRecruiters,
            inactiveRecruiters,
            totalWorkers,
            totalJobs,
            activeJobs,
            draftJobs,
            closedJobs,
            totalApplications,
            applicationsByStatus: {
                applied: appliedApplications,
                shortlisted: shortlistedApplications,
                interview_scheduled: interviewApplications,
                hired: hiredApplications,
                rejected: rejectedApplications,
            },
            masterData: {
                industries,
                locations,
                skills,
                jobRoles,
                languages,
                qualifications,
            },
        };
    }
    // Runs inside the createRecruiter transaction in admin.service.ts —
    // this is the one User row that used to require an HTTP call to
    // Auth Service in the microservices version.
    createUserForRecruiter(tx, data) {
        return tx.user.create({
            data: { ...data, role: "recruiter", phoneVerified: true },
        });
    }
    createRecruiterProfile(tx, data) {
        return tx.recruiter.create({
            data: {
                userId: data.userId,
                name: data.name,
                email: data.email,
                createdById: data.createdById,
                categories: {
                    create: data.industryIds.map((industryId) => ({ industryId })),
                },
            },
            include: { categories: { include: { industry: true } } },
        });
    }
    findRecruiterById(id) {
        return db_1.prisma.recruiter.findUnique({
            where: { id },
            include: {
                categories: { include: { industry: true } },
                user: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        isActive: true,
                        createdAt: true,
                        _count: { select: { jobsPosted: true } },
                    },
                },
            },
        });
    }
    listRecruiters() {
        return db_1.prisma.recruiter.findMany({
            include: {
                categories: { include: { industry: true } },
                user: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        isActive: true,
                        createdAt: true,
                        _count: { select: { jobsPosted: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async updateRecruiterInfo(id, data) {
        return db_1.prisma.$transaction(async (tx) => {
            const recruiterData = {};
            if (data.name !== undefined)
                recruiterData.name = data.name;
            if (data.email !== undefined)
                recruiterData.email = data.email;
            if (Object.keys(recruiterData).length > 0) {
                await tx.recruiter.update({ where: { id }, data: recruiterData });
            }
            const userData = {};
            if (data.email !== undefined)
                userData.email = data.email;
            if (data.phone !== undefined)
                userData.phone = data.phone;
            if (Object.keys(userData).length > 0) {
                await tx.user.update({ where: { id: data.userId }, data: userData });
            }
            if (data.industryIds?.length) {
                await tx.recruiterCategory.deleteMany({ where: { recruiterId: id } });
                await tx.recruiterCategory.createMany({
                    data: data.industryIds.map((industryId) => ({
                        recruiterId: id,
                        industryId,
                    })),
                });
            }
        });
    }
    async replaceCategories(recruiterId, industryIds) {
        await db_1.prisma.$transaction([
            db_1.prisma.recruiterCategory.deleteMany({ where: { recruiterId } }),
            db_1.prisma.recruiterCategory.createMany({
                data: industryIds.map((industryId) => ({ recruiterId, industryId })),
            }),
        ]);
    }
    // Updates Recruiter.isActive AND the underlying User.isActive in one
    // transaction. The microservices version only ever flipped the
    // Recruiter row — Auth Service had no idea, so a "deactivated" recruiter
    // could still log in. One DB means this gap is now closed for real.
    setRecruiterActive(id, isActive) {
        return db_1.prisma.$transaction(async (tx) => {
            const recruiter = await tx.recruiter.update({
                where: { id },
                data: { isActive },
            });
            await tx.user.update({
                where: { id: recruiter.userId },
                data: { isActive },
            });
            return recruiter;
        });
    }
    deleteRecruiterAccount(recruiterId, userId) {
        return db_1.prisma.$transaction([
            db_1.prisma.recruiter.delete({ where: { id: recruiterId } }),
            db_1.prisma.user.delete({ where: { id: userId } }),
        ]);
    }
}
exports.AdminRepository = AdminRepository;
