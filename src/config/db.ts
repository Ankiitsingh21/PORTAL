import { PrismaClient } from "../generated/prisma/client";

export const prisma = new PrismaClient();

export const connectDB = async () => {
  const MAX_RETRIES = 5;
  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      await prisma.$connect();
      console.log("PostgreSQL Connected");
      return;
    } catch (error) {
      console.log(`Postgres connection failed. Attempt ${i}`, error);
      if (i === MAX_RETRIES) throw error;
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
};