"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRepository = void 0;
const db_1 = require("../../config/db");
class AdminRepository {
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
            include: { categories: { include: { industry: true } }, user: true },
        });
    }
    listRecruiters() {
        return db_1.prisma.recruiter.findMany({
            include: { categories: { include: { industry: true } } },
            orderBy: { createdAt: "desc" },
        });
    }
    updateRecruiterInfo(id, data) {
        return db_1.prisma.recruiter.update({ where: { id }, data });
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
}
exports.AdminRepository = AdminRepository;
