import jwt from "jsonwebtoken";
import { AuthRepository } from "./auth.repository";
import { Password } from "../../utils/password";
import { BadRequestError, NotFoundError } from "../../common/errors";
import { UserPayload } from "../../common/types";
import { storeOtp, getOtp, clearOtp } from "../../config/redis";
import { sendSms } from "../notification/sms.service";
import { sendEmail } from "../notification/email.service";

const repo = new AuthRepository();

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const signToken = (payload: UserPayload) =>
  jwt.sign(payload, process.env.JWT_KEY!);

const sanitize = (user: any) => {
  const { passwordHash, workerProfile, ...rest } = user;
  return rest;
};

// Registration only ever collects a single "name" field (WorkerProfile.name).
// verify-otp needs firstName/lastName separately, so split it here instead
// of touching the registration flow at all.
const splitName = (fullName?: string | null) => {
  if (!fullName || !fullName.trim()) return { firstName: "", lastName: "" };
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
  };
};

// ───────────── Worker registration + OTP ─────────────
export const registerWorker = async (
  email: string,
  password: string,
  phone: string,
  name?: string,
) => {
  if (await repo.findByEmail(email))
    throw new BadRequestError("Email already registered");
  if (await repo.findByPhone(phone))
    throw new BadRequestError("Phone already registered");

  const passwordHash = await Password.toHash(password);
  const user = await repo.createWorkerAccount({
    email,
    passwordHash,
    phone,
    name,
  });

  const otp = generateOtp();
  await storeOtp(phone, otp);

  return {
    userId: user.id,
    devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
  };
};

export const verifyWorkerOtp = async (phone: string, otp: string) => {
  const storedOtp = await getOtp(phone);
  if (!storedOtp || storedOtp !== otp) {
    throw new BadRequestError("Invalid or expired OTP");
  }

  const user = await repo.markPhoneVerified(phone);
  await clearOtp(phone);

  const token = signToken({ id: user.id, role: "worker" });
  const { firstName, lastName } = splitName(
    (user as any).workerProfile?.name,
  );

  return { token, user: sanitize(user), firstName, lastName };
};

export const resendWorkerOtp = async (phone: string) => {
  const user = await repo.findByPhone(phone);
  if (!user) throw new NotFoundError("No registration found for this phone");

  const otp = generateOtp();
  await storeOtp(phone, otp);

  return {
    devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
  };
};

// ───────────── Login (all roles) ─────────────
export const login = async (email: string, password: string) => {
  const user = await repo.findByEmail(email);
  if (!user || !user.isActive) throw new BadRequestError("Invalid credentials");

  const passwordMatch = await Password.compare(user.passwordHash, password);
  if (!passwordMatch) throw new BadRequestError("Invalid credentials");

  if (user.role === "worker" && !user.phoneVerified) {
    throw new BadRequestError("Please verify your phone number first");
  }

  const token = signToken({
    id: user.id,
    role: user.role as UserPayload["role"],
  });
  return { token, user: sanitize(user) };
};

// ───────────── Current user ─────────────
export const getCurrentUser = async (id: string) => {
  const user = await repo.findById(id);
  if (!user || !user.isActive) return null;
  return sanitize(user);
};

// ───────────── Onboarding status ─────────────
// Driven off WorkerProfile.profileComplete — the same flag worker.service
// already flips to true once name/phone/resume/skills are all filled in.
//   - no profile row yet      -> needsOnboarding: true
//   - profile incomplete      -> needsOnboarding: true
//   - profile marked complete -> needsOnboarding: false, forever, until
//     something makes it incomplete again.
export const getOnboardingStatus = async (userId: string, role: string) => {
  if (role !== "worker") {
    return { needsOnboarding: false };
  }

  const profile = await repo.findWorkerProfileCompletion(userId);
  if (!profile) return { needsOnboarding: true };

  return { needsOnboarding: !profile.profileComplete };
};