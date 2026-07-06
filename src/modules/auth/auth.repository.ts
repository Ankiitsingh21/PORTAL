import { prisma } from "../../config/db";
import { Role } from "../../generated/prisma/client";

export class AuthRepository {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  findByPhone(phone: string) {
    return prisma.user.findUnique({ where: { phone } });
  }

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  create(data: {
    email: string;
    passwordHash: string;
    phone?: string;
    role: Role;
    phoneVerified?: boolean;
  }) {
    return prisma.user.create({ data });
  }

  createWorkerAccount(data: {
    email: string;
    passwordHash: string;
    phone: string;
    name?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          phone: data.phone,
          role: "worker",
          phoneVerified: false,
        },
      });

      await tx.workerProfile.create({
        data: {
          userId: user.id,
          name: data.name,
          phone: data.phone,
        },
      });

      return user;
    });
  }

  markPhoneVerified(phone: string) {
    return prisma.user.update({
      where: { phone },
      data: { phoneVerified: true },
    });
  }
}
