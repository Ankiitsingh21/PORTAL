import { prisma } from "../../config/db";

export class ApplicationRepository {
  private applicationInclude = {
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
      orderBy: { changedAt: "asc" as const },
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
    return prisma.application.create({
      data,
      include: this.applicationInclude,
    });
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
      include: this.applicationInclude,
    });
  }

  listByJob(jobId: string) {
    return prisma.application.findMany({
      where: { jobId },
      orderBy: { appliedAt: "desc" },
      include: this.applicationInclude,
    });
  }

  findById(id: string) {
    return prisma.application.findUnique({
      where: { id },
      include: this.applicationInclude,
    });
  }

  findByIdBasic(id: string) {
    return prisma.application.findUnique({ where: { id } });
  }

  update(id: string, data: Record<string, any>) {
    return prisma.application.update({
      where: { id },
      data,
      include: this.applicationInclude,
    });
  }

  delete(id: string) {
    return prisma.application.delete({ where: { id } });
  }

  // ───────────── For Admin reporting (direct call now, no internal HTTP) ─────────────
  listByJobIds(jobIds: string[]) {
    return prisma.application.findMany({
      where: { jobId: { in: jobIds } },
      include: this.applicationInclude,
    });
  }

  listByRecruiter(recruiterId: string) {
    return prisma.application.findMany({
      where: { recruiterId },
      orderBy: { appliedAt: "desc" },
      include: this.applicationInclude,
    });
  }

  listAll() {
    return prisma.application.findMany({
      orderBy: { appliedAt: "desc" },
      include: this.applicationInclude,
    });
  }
}
