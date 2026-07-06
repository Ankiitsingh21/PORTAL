import { prisma } from "../../config/db";
import { AdminRepository } from "./admin.repository";
import { Password } from "../../utils/password";
import { BadRequestError, NotFoundError } from "../../common/errors";
import { sendEmail } from "../notification/email.service";

const repo = new AdminRepository();

// ───────────── Create recruiter ─────────────
// Single Prisma transaction creates both the User (login) and the
// Recruiter profile + initial categories. In microservices this was two
// separate writes across two databases (HTTP call to Auth Service, then a
// local DB write) with no way to roll back the first if the second
// failed — a real ACID gap. This closes it.
export const createRecruiter = async (
  name: string,
  email: string,
  password: string,
  createdById: string,
  industryIds: number[],
) => {
  const passwordHash = await Password.toHash(password);

  const recruiter = await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestError("Email already registered");

    const user = await repo.createUserForRecruiter(tx, { email, passwordHash });
    // console.log(user);
    return repo.createRecruiterProfile(tx, {
      userId: user.id,
      name,
      email,
      createdById,
      industryIds,
    });
  });

  // The microservices Notification handler had a case for
  // "auth.recruiter.created" with an email + tempPassword payload, but
  // nothing ever published that event — admin.service.ts never imported
  // natsWrapper. Wiring it up here actually makes the recruiter find out
  // their own login.
  await sendEmail(
    email,
    "Your SCN Jobs recruiter account",
    `Email: ${email}\nPassword: ${password}`,
  );

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
export const updateRecruiter = (
  id: string,
  data: Partial<{ name: string; email: string }>,
) => repo.updateRecruiterInfo(id, data);

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
