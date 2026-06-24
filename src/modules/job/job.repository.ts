import { prisma } from "../../config/db";
import { WageType, ShiftType, JobType } from "../../generated/prisma/client";

// Mirrors exactly what job.service.createJob builds before calling
// repo.create(). Needed as a concrete type (not Record<string, any>) so
// TypeScript can see that title/industryId/locationId/headcountRequired
// are guaranteed present after destructuring — a loosely-typed Record
// doesn't prove that to Prisma's generated JobUncheckedCreateInput, even
// though the runtime object always has them.
export interface CreateJobInput {
  title: string;
  description?: string;
  industryId: number;
  functionId?: number;
  jobRoleId?: number;
  locationId: number;
  wageMin?: number;
  wageMax?: number;
  wageType?: WageType;
  shiftType?: ShiftType;
  jobType?: JobType;
  headcountRequired: number;
  minExperienceMonths?: number;
  skillIds?: number[];
  qualificationIds?: number[];
}

export class JobRepository {
  create(postedBy: string, data: CreateJobInput) {
    const { skillIds, qualificationIds, ...rest } = data;
    return prisma.job.create({
      data: {
        ...rest,
        postedBy,
        skills: skillIds ? { create: skillIds.map((skillId) => ({ skillId })) } : undefined,
        qualifications: qualificationIds
          ? { create: qualificationIds.map((qualificationId) => ({ qualificationId })) }
          : undefined,
      },
      include: { skills: true, qualifications: true },
    });
  }

  findById(id: string) {
    return prisma.job.findUnique({
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
    return prisma.job.findMany({ where: { status: "active" }, orderBy: { createdAt: "desc" } });
  }

  listByPoster(postedBy: string) {
    return prisma.job.findMany({ where: { postedBy }, orderBy: { createdAt: "desc" } });
  }

  listAll() {
    return prisma.job.findMany({ orderBy: { createdAt: "desc" } });
  }

  update(id: string, data: Record<string, any>) {
    return prisma.job.update({ where: { id }, data });
  }

  updateStatus(id: string, status: string) {
    return prisma.job.update({ where: { id }, data: { status: status as any } });
  }

  delete(id: string) {
    return prisma.job.delete({ where: { id } });
  }

  reassign(id: string, postedBy: string) {
    return prisma.job.update({ where: { id }, data: { postedBy } });
  }

  // Used by job.middlewares.categoryGuard — replaces the JWT-based
  // `assignedCategories` check from the microservices version with a live
  // join against RecruiterCategory.
  isRecruiterAssignedToIndustry(recruiterUserId: string, industryId: number) {
    return prisma.recruiterCategory.findFirst({
      where: { industryId, recruiter: { userId: recruiterUserId } },
    });
  }
}
