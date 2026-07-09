"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.prisma = void 0;
const client_1 = require("../generated/prisma/client");
exports.prisma = new client_1.PrismaClient();
const connectDB = async () => {
    const MAX_RETRIES = 5;
    for (let i = 1; i <= MAX_RETRIES; i++) {
        try {
            await exports.prisma.$connect();
            console.log("PostgreSQL Connected");
            return;
        }
        catch (error) {
            console.log(`Postgres connection failed. Attempt ${i}`, error);
            if (i === MAX_RETRIES)
                throw error;
            await new Promise((res) => setTimeout(res, 5000));
        }
    }
};
exports.connectDB = connectDB;
