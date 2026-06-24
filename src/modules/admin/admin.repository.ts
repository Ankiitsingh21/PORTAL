import { prisma } from "../../config/db";
import { Prisma } from "../../generated/prisma/client";

type Tx = Prisma.TransactionClient;

export class AdminRepository {
  // Runs inside the createRecruiter transaction in admin.service.ts —
  // this is the one User row that used to require an HTTP call to
  // Auth Service in the microservices version.
  createUserForRecruiter(
    tx: Tx,
    data: { email: string; passwordHash: string },
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
      include: { categories: { include: { industry: true } }, user: true },
    });
  }

  listRecruiters() {
    return prisma.recruiter.findMany({
      include: { categories: { include: { industry: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  updateRecruiterInfo(
    id: string,
    data: Partial<{ name: string; email: string }>,
  ) {
    return prisma.recruiter.update({ where: { id }, data });
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
}
