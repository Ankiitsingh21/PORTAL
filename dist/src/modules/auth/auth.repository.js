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
    markPhoneVerified(phone) {
        return db_1.prisma.user.update({
            where: { phone },
            data: { phoneVerified: true },
        });
    }
}
exports.AuthRepository = AuthRepository;
