import "dotenv/config";
import { prisma } from "../src/config/db";
import { Password } from "../src/utils/password";

// Resets the password for an EXISTING user (any role) to whatever is
// in ADMIN_PASSWORD — use this instead of deleting/recreating a user
// that already has other rows pointing at it (Recruiter.createdById,
// Job.postedBy, Application.recruiterId, etc). Deleting a referenced
// User is what triggered the RESTRICT foreign key error you just saw;
// this avoids that entirely by never touching the row's id.
const resetPassword = async () => {
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    throw new Error(`No user found with email ${email}`);
  }

  const passwordHash = await Password.toHash(password);
  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  console.log(`Password reset for ${email} (role: ${existing.role})`);
};

resetPassword()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });