"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const db_1 = require("../src/config/db");
const password_1 = require("../src/utils/password");
const seedAdmin = async () => {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
        throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    }
    const existing = await db_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log("Admin already exists, skipping");
        return;
    }
    const passwordHash = await password_1.Password.toHash(password);
    await db_1.prisma.user.create({
        data: { email, passwordHash, role: "super_admin", phoneVerified: true },
    });
    console.log("Super admin created:", email);
};
seedAdmin()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await db_1.prisma.$disconnect();
});
