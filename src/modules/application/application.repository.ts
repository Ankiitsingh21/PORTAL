import { prisma } from "../../config/db";

export class ApplicationRepository {
  findByJobAndWorker(jobId: string, workerId: string) {
    return prisma.application.findUnique({
      where: { jobId_workerId: { jobId, workerId } },
    });
  }

  create(data: {
    jobId: string;
    workerId: string;
    recruiterId: string;
    coverNote?: string;
  }) {
    return prisma.application.create({ data });
  }

  addHistory(data: {
    applicationId: string;
    fromStatus?: string;
    toStatus: string;
    changedById: string;
    notes?: string;
  }) {
    return prisma.applicationStatusHistory.create({ data });
  }

  listByWorker(workerId: string) {
    return prisma.application.findMany({
      where: { workerId },
      orderBy: { appliedAt: "desc" },
    });
  }

  listByJob(jobId: string) {
    return prisma.application.findMany({
      where: { jobId },
      orderBy: { appliedAt: "desc" },
    });
  }

  findById(id: string) {
    return prisma.application.findUnique({
      where: { id },
      include: {
        history: true,
        worker: { select: { id: true, email: true, phone: true } },
      },
    });
  }

  findByIdBasic(id: string) {
    return prisma.application.findUnique({ where: { id } });
  }

  update(id: string, data: Record<string, any>) {
    return prisma.application.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.application.delete({ where: { id } });
  }

  // ───────────── For Admin reporting (direct call now, no internal HTTP) ─────────────
  listByJobIds(jobIds: string[]) {
    return prisma.application.findMany({ where: { jobId: { in: jobIds } } });
  }

  listByRecruiter(recruiterId: string) {
    return prisma.application.findMany({ where: { recruiterId } });
  }
}
