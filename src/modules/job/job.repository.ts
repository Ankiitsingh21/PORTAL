import { prisma } from "../../config/db";
import { WageType, ShiftType, JobType } from "../../generated/prisma/client";

export interface CreateJobInput {
  title: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
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
  private jobListInclude = {
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

  create(postedBy: string, data: CreateJobInput) {
    const { skillIds, qualificationIds, ...rest } = data;

    return prisma.job.create({
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

  findById(id: string) {
    return prisma.job.findUnique({
      where: { id },
      include: {
        ...this.jobListInclude,
      },
    });
  }

  // ✅ Fixed
  listActive() {
    return prisma.job.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      include: {
        ...this.jobListInclude,
      },
    });
  }

  // ✅ Fixed
  listByPoster(postedBy: string) {
    return prisma.job.findMany({
      where: { postedBy },
      orderBy: { createdAt: "desc" },
      include: {
        ...this.jobListInclude,
      },
    });
  }

  // ✅ Fixed
  listAll() {
    return prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        ...this.jobListInclude,
      },
    });
  }

  update(id: string, data: Record<string, any>) {
    return prisma.job.update({
      where: { id },
      data,
    });
  }

  updateStatus(id: string, status: string) {
    return prisma.job.update({
      where: { id },
      data: {
        status: status as any,
      },
    });
  }

  delete(id: string) {
    return prisma.job.delete({
      where: { id },
    });
  }

  reassign(id: string, postedBy: string) {
    return prisma.job.update({
      where: { id },
      data: {
        postedBy,
      },
    });
  }

  isRecruiterAssignedToIndustry(
    recruiterUserId: string,
    industryId: number
  ) {
    return prisma.recruiterCategory.findFirst({
      where: {
        industryId,
        recruiter: {
          userId: recruiterUserId,
        },
      },
    });
  }
}
