"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationRepository = void 0;
const db_1 = require("../../config/db");
class ApplicationRepository {
    findByJobAndWorker(jobId, workerId) {
        return db_1.prisma.application.findUnique({
            where: { jobId_workerId: { jobId, workerId } },
        });
    }
    create(data) {
        return db_1.prisma.application.create({ data });
    }
    addHistory(data) {
        return db_1.prisma.applicationStatusHistory.create({ data });
    }
    listByWorker(workerId) {
        return db_1.prisma.application.findMany({
            where: { workerId },
            orderBy: { appliedAt: "desc" },
        });
    }
    listByJob(jobId) {
        return db_1.prisma.application.findMany({
            where: { jobId },
            orderBy: { appliedAt: "desc" },
        });
    }
    findById(id) {
        return db_1.prisma.application.findUnique({
            where: { id },
            include: {
                history: true,
                worker: { select: { id: true, email: true, phone: true } },
            },
        });
    }
    findByIdBasic(id) {
        return db_1.prisma.application.findUnique({ where: { id } });
    }
    update(id, data) {
        return db_1.prisma.application.update({ where: { id }, data });
    }
    delete(id) {
        return db_1.prisma.application.delete({ where: { id } });
    }
    // ───────────── For Admin reporting (direct call now, no internal HTTP) ─────────────
    listByJobIds(jobIds) {
        return db_1.prisma.application.findMany({ where: { jobId: { in: jobIds } } });
    }
    listByRecruiter(recruiterId) {
        return db_1.prisma.application.findMany({ where: { recruiterId } });
    }
}
exports.ApplicationRepository = ApplicationRepository;
