import { prisma } from "../../config/db";
import { Prisma } from "../../generated/prisma/client";

type Tx = Prisma.TransactionClient;

export class AdminRepository {
  async getStats() {
    const [
      totalRecruiters,
      activeRecruiters,
      inactiveRecruiters,
      totalWorkers,
      totalJobs,
      activeJobs,
      draftJobs,
      closedJobs,
      totalApplications,
      appliedApplications,
      shortlistedApplications,
      interviewApplications,
      hiredApplications,
      rejectedApplications,
      industries,
      locations,
      skills,
      jobRoles,
      languages,
      qualifications,
    ] = await Promise.all([
      prisma.recruiter.count(),
      prisma.recruiter.count({ where: { isActive: true } }),
      prisma.recruiter.count({ where: { isActive: false } }),
      prisma.workerProfile.count(),
      prisma.job.count(),
      prisma.job.count({ where: { status: "active" } }),
      prisma.job.count({ where: { status: "draft" } }),
      prisma.job.count({ where: { status: "closed" } }),
      prisma.application.count(),
      prisma.application.count({ where: { status: "applied" } }),
      prisma.application.count({ where: { status: "shortlisted" } }),
      prisma.application.count({ where: { status: "interview_scheduled" } }),
      prisma.application.count({ where: { status: "hired" } }),
      prisma.application.count({ where: { status: "rejected" } }),
      prisma.industry.count({ where: { isActive: true } }),
      prisma.location.count({ where: { isActive: true } }),
      prisma.skill.count({ where: { isActive: true } }),
      prisma.jobRole.count({ where: { isActive: true } }),
      prisma.language.count({ where: { isActive: true } }),
      prisma.qualification.count({ where: { isActive: true } }),
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
  createUserForRecruiter(
    tx: Tx,
    data: { email: string; phone?: string; passwordHash: string },
  ) {
    return tx.user.create({
      data: { ...data, role: "recruiter", phoneVerified: true },
    });
  }

  createRecruiterProfile(
    tx: Tx,
    data: {
      userId: string;
      name: string;
      email: string;
      createdById: string;
      industryIds: number[];
    },
  ) {
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

  findRecruiterById(id: string) {
    return prisma.recruiter.findUnique({
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
    return prisma.recruiter.findMany({
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

  async updateRecruiterInfo(
    id: string,
    data: {
      userId: string;
      name?: string;
      email?: string;
      phone?: string | null;
      industryIds?: number[];
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const recruiterData: Prisma.RecruiterUpdateInput = {};
      if (data.name !== undefined) recruiterData.name = data.name;
      if (data.email !== undefined) recruiterData.email = data.email;

      if (Object.keys(recruiterData).length > 0) {
        await tx.recruiter.update({ where: { id }, data: recruiterData });
      }

      const userData: Prisma.UserUpdateInput = {};
      if (data.email !== undefined) userData.email = data.email;
      if (data.phone !== undefined) userData.phone = data.phone;

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

  async replaceCategories(recruiterId: string, industryIds: number[]) {
    await prisma.$transaction([
      prisma.recruiterCategory.deleteMany({ where: { recruiterId } }),
      prisma.recruiterCategory.createMany({
        data: industryIds.map((industryId) => ({ recruiterId, industryId })),
      }),
    ]);
  }

  // Updates Recruiter.isActive AND the underlying User.isActive in one
  // transaction. The microservices version only ever flipped the
  // Recruiter row — Auth Service had no idea, so a "deactivated" recruiter
  // could still log in. One DB means this gap is now closed for real.
  setRecruiterActive(id: string, isActive: boolean) {
    return prisma.$transaction(async (tx) => {
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

  deleteRecruiterAccount(recruiterId: string, userId: string) {
    return prisma.$transaction([
      prisma.recruiter.delete({ where: { id: recruiterId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
  }
}
