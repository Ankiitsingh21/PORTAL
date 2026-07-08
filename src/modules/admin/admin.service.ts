import { prisma } from "../../config/db";
import { AdminRepository } from "./admin.repository";
import { Password } from "../../utils/password";
import { BadRequestError, NotFoundError } from "../../common/errors";
import { sendEmail } from "../notification/email.service";

const repo = new AdminRepository();

export const getStats = () => repo.getStats();

// ───────────── Create recruiter ─────────────
// Single Prisma transaction creates both the User (login) and the
// Recruiter profile + initial categories. In microservices this was two
// separate writes across two databases (HTTP call to Auth Service, then a
// local DB write) with no way to roll back the first if the second
// failed — a real ACID gap. This closes it.
export const createRecruiter = async (
  name: string,
  email: string,
  phone: string | undefined,
  password: string,
  createdById: string,
  industryIds: number[],
) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone?.trim() || undefined;
  const passwordHash = await Password.toHash(password);
  console.log(normalizedEmail);
  const recruiter = await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new BadRequestError("Email already registered");
    if (normalizedPhone) {
      const existingPhone = await tx.user.findUnique({ where: { phone: normalizedPhone } });
      if (existingPhone) throw new BadRequestError("Phone already registered");
    }

    const user = await repo.createUserForRecruiter(tx, {
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
    });
    // console.log(user);
    return repo.createRecruiterProfile(tx, {
      userId: user.id,
      name,
      email: normalizedEmail,
      createdById,
      industryIds,
    });
  });

  // The microservices Notification handler had a case for
  // "auth.recruiter.created" with an email + tempPassword payload, but
  // nothing ever published that event — admin.service.ts never imported
  // natsWrapper. Wiring it up here actually makes the recruiter find out
  // their own login.
  // try {
  //   await sendEmail(
  //     normalizedEmail,
  //     "Your SCN Jobs recruiter account",
  //     `Email: ${normalizedEmail}\nPassword: ${password}`,
  //   );
  // } catch (err) {
  //   console.error("Failed to send welcome email, but recruiter was created.", err);
  // }

  return recruiter;
};

// ───────────── List / get ─────────────
export const listRecruiters = () => repo.listRecruiters();

export const getRecruiter = async (id: string) => {
  const recruiter = await repo.findRecruiterById(id);
  if (!recruiter) throw new NotFoundError("Recruiter not found");
  return recruiter;
};

// ───────────── Update basic info ─────────────
export const updateRecruiter = async (
  id: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    industryIds: number[];
  }>,
) => {
  const recruiter = await repo.findRecruiterById(id);
  if (!recruiter) throw new NotFoundError("Recruiter not found");

  const name = data.name?.trim();
  const email = data.email?.trim().toLowerCase();
  const phone = data.phone?.trim() || null;
  if (data.industryIds !== undefined && data.industryIds.length === 0) {
    throw new BadRequestError("At least one category is required");
  }

  if (email && email !== recruiter.user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== recruiter.user.id) {
      throw new BadRequestError("Email already registered");
    }
  }

  if (phone && phone !== recruiter.user.phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone && existingPhone.id !== recruiter.user.id) {
      throw new BadRequestError("Phone already registered");
    }
  }

  await repo.updateRecruiterInfo(id, {
    userId: recruiter.user.id,
    name,
    email,
    phone,
    industryIds: data.industryIds,
  });

  return getRecruiter(id);
};

export const deleteRecruiter = async (id: string) => {
  const recruiter = await repo.findRecruiterById(id);
  if (!recruiter) throw new NotFoundError("Recruiter not found");

  const postedJobs = recruiter.user._count.jobsPosted;
  if (postedJobs > 0) {
    throw new BadRequestError(
      "Recruiters with posted jobs cannot be deleted. Deactivate the recruiter instead.",
    );
  }

  await repo.deleteRecruiterAccount(id, recruiter.user.id);
  return { deleted: true };
};

// ───────────── Full replace categories ─────────────
export const replaceCategories = async (
  recruiterId: string,
  industryIds: number[],
) => {
  const recruiter = await repo.findRecruiterById(recruiterId);
  if (!recruiter) throw new NotFoundError("Recruiter not found");

  await repo.replaceCategories(recruiterId, industryIds);
  return getRecruiter(recruiterId);
};

// ───────────── Activate / deactivate ─────────────
export const setRecruiterActive = (id: string, isActive: boolean) =>
  repo.setRecruiterActive(id, isActive);
