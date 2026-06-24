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

  markPhoneVerified(phone: string) {
    return prisma.user.update({
      where: { phone },
      data: { phoneVerified: true },
    });
  }
}
