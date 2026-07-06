import { prisma } from "../../config/db";

export class WorkerRepository {
  findByUserId(userId: string) {
    return prisma.workerProfile.findUnique({ where: { userId } });
  }

  findByUserIdFull(userId: string) {
    return prisma.workerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
        education: { include: { qualification: true } },
        experience: true,
        skills: { include: { skill: true } },
        languages: { include: { language: true } },
        preferredLocations: { include: { location: true } },
        preferredIndustries: { include: { industry: true } },
      },
    });
  }

  createProfile(userId: string) {
    return prisma.workerProfile.create({ data: { userId } });
  }

  updateProfile(userId: string, data: Record<string, any>) {
    return prisma.workerProfile.update({ where: { userId }, data });
  }

  setProfileComplete(userId: string, complete: boolean) {
    return prisma.workerProfile.update({
      where: { userId },
      data: { profileComplete: complete },
    });
  }

  // ───────────── Junction-table replace helpers ─────────────
  // Each of these replaces the microservices' Int[] soft-ref array with a
  // delete-then-recreate against the real junction table — same "full
  // replace" semantics as before, now FK-enforced.
  replaceSkills(workerId: string, skillIds: number[]) {
    return prisma.$transaction([
      prisma.workerSkill.deleteMany({ where: { workerId } }),
      prisma.workerSkill.createMany({
        data: skillIds.map((skillId) => ({ workerId, skillId })),
      }),
    ]);
  }

  replaceLanguages(
    workerId: string,
    languages: { languageId: number; proficiency?: string }[],
  ) {
    return prisma.$transaction([
      prisma.workerLanguage.deleteMany({ where: { workerId } }),
      prisma.workerLanguage.createMany({
        data: languages.map((l) => ({
          workerId,
          languageId: l.languageId,
          proficiency: l.proficiency as any,
        })),
      }),
    ]);
  }

  replacePreferredLocations(workerId: string, locationIds: number[]) {
    return prisma.$transaction([
      prisma.workerPreferredLocation.deleteMany({ where: { workerId } }),
      prisma.workerPreferredLocation.createMany({
        data: locationIds.map((locationId) => ({ workerId, locationId })),
      }),
    ]);
  }

  replacePreferredIndustries(workerId: string, industryIds: number[]) {
    return prisma.$transaction([
      prisma.workerPreferredIndustry.deleteMany({ where: { workerId } }),
      prisma.workerPreferredIndustry.createMany({
        data: industryIds.map((industryId) => ({ workerId, industryId })),
      }),
    ]);
  }

  // ───────────── Education ─────────────
  addEducation(
    workerId: string,
    data: {
      qualificationId: number;
      institute?: string;
      passoutYear?: number;
      score?: string;
    },
  ) {
    return prisma.workerEducation.create({ data: { workerId, ...data } });
  }

  findEducation(workerId: string, id: string) {
    return prisma.workerEducation.findFirst({ where: { id, workerId } });
  }

  updateEducation(id: string, data: Record<string, any>) {
    return prisma.workerEducation.update({ where: { id }, data });
  }

  deleteEducation(id: string) {
    return prisma.workerEducation.delete({ where: { id } });
  }

  // ───────────── Experience ─────────────
  // Concrete type, not Record<string, any> — same reasoning as
  // JobRepository.create: Prisma's WorkerExperienceUncheckedCreateInput
  // requires companyName/jobTitle/fromDate, and a loosely-typed Record
  // doesn't prove those are present even though they always are here.
  addExperience(
    workerId: string,
    data: {
      companyName: string;
      jobTitle: string;
      fromDate: Date;
      toDate?: Date;
      isCurrent?: boolean;
      description?: string;
    },
  ) {
    return prisma.workerExperience.create({ data: { workerId, ...data } });
  }

  findExperience(workerId: string, id: string) {
    return prisma.workerExperience.findFirst({ where: { id, workerId } });
  }

  updateExperience(id: string, data: Record<string, any>) {
    return prisma.workerExperience.update({ where: { id }, data });
  }

  deleteExperience(id: string) {
    return prisma.workerExperience.delete({ where: { id } });
  }

  // ───────────── Recruiter/Admin-facing search ─────────────
  searchWorkers(where: Record<string, any>) {
    return prisma.workerProfile.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
        name: true,
        phone: true,
        headline: true,
        summary: true,
        city: true,
        currentLocality: true,
        expectedSalaryMin: true,
        expectedSalaryMax: true,
        availability: true,
        profileComplete: true,
        profilePhotoUrl: true,
        totalExperienceMonths: true,
        resumeUrl: true,
        skills: { include: { skill: true } },
        languages: { include: { language: true } },
        preferredLocations: { include: { location: true } },
        preferredIndustries: { include: { industry: true } },
      },
    });
  }

  findById(id: string) {
    return prisma.workerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
        education: { include: { qualification: true } },
        experience: true,
        skills: { include: { skill: true } },
        languages: { include: { language: true } },
        preferredLocations: { include: { location: true } },
        preferredIndustries: { include: { industry: true } },
      },
    });
  }

  getRecruiterAssignedIndustryIds(recruiterUserId: string) {
    return prisma.recruiterCategory.findMany({
      where: { recruiter: { userId: recruiterUserId } },
      select: { industryId: true },
    });
  }
}
