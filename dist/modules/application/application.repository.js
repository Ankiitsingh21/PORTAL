"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationRepository = void 0;
const db_1 = require("../../config/db");
class ApplicationRepository {
    constructor() {
        this.applicationInclude = {
            job: {
                include: {
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
                },
            },
            worker: {
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    isActive: true,
                    workerProfile: {
                        include: {
                            education: { include: { qualification: true } },
                            experience: true,
                            skills: { include: { skill: true } },
                            languages: { include: { language: true } },
                            preferredLocations: { include: { location: true } },
                            preferredIndustries: { include: { industry: true } },
                        },
                    },
                },
            },
            recruiter: {
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
            history: {
                orderBy: { changedAt: "asc" },
                include: {
                    changedBy: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            },
        };
    }
    findByJobAndWorker(jobId, workerId) {
        return db_1.prisma.application.findUnique({
            where: { jobId_workerId: { jobId, workerId } },
        });
    }
    create(data) {
        return db_1.prisma.application.create({
            data,
            include: this.applicationInclude,
        });
    }
    addHistory(data) {
        return db_1.prisma.applicationStatusHistory.create({ data });
    }
    listByWorker(workerId) {
        return db_1.prisma.application.findMany({
            where: { workerId },
            orderBy: { appliedAt: "desc" },
            include: this.applicationInclude,
        });
    }
    listByJob(jobId) {
        return db_1.prisma.application.findMany({
            where: { jobId },
            orderBy: { appliedAt: "desc" },
            include: this.applicationInclude,
        });
    }
    findById(id) {
        return db_1.prisma.application.findUnique({
            where: { id },
            include: this.applicationInclude,
        });
    }
    findByIdBasic(id) {
        return db_1.prisma.application.findUnique({ where: { id } });
    }
    update(id, data) {
        return db_1.prisma.application.update({
            where: { id },
            data,
            include: this.applicationInclude,
        });
    }
    delete(id) {
        return db_1.prisma.application.delete({ where: { id } });
    }
    // ───────────── For Admin reporting (direct call now, no internal HTTP) ─────────────
    listByJobIds(jobIds) {
        return db_1.prisma.application.findMany({
            where: { jobId: { in: jobIds } },
            include: this.applicationInclude,
        });
    }
    listByRecruiter(recruiterId) {
        return db_1.prisma.application.findMany({
            where: { recruiterId },
            orderBy: { appliedAt: "desc" },
            include: this.applicationInclude,
        });
    }
    listAll() {
        return db_1.prisma.application.findMany({
            orderBy: { appliedAt: "desc" },
            include: this.applicationInclude,
        });
    }
}
exports.ApplicationRepository = ApplicationRepository;
