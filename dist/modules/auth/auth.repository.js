"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const db_1 = require("../../config/db");
class AuthRepository {
    findByEmail(email) {
        return db_1.prisma.user.findUnique({ where: { email } });
    }
    findByPhone(phone) {
        return db_1.prisma.user.findUnique({ where: { phone } });
    }
    findById(id) {
        return db_1.prisma.user.findUnique({ where: { id } });
    }
    create(data) {
        return db_1.prisma.user.create({ data });
    }
    createWorkerAccount(data) {
        return db_1.prisma.$transaction(async (tx) => {
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
    markPhoneVerified(phone) {
        return db_1.prisma.user.update({
            where: { phone },
            data: { phoneVerified: true },
            // Pull the name saved on WorkerProfile at registration so the
            // service layer can split it into firstName/lastName for the
            // verify-otp response.
            include: { workerProfile: { select: { name: true } } },
        });
    }
    findWorkerProfileCompletion(userId) {
        return db_1.prisma.workerProfile.findUnique({
            where: { userId },
            select: { profileComplete: true },
        });
    }
}
exports.AuthRepository = AuthRepository;
