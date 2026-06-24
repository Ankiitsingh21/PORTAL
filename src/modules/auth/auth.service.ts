import jwt from "jsonwebtoken";
import { AuthRepository } from "./auth.repository";
import { Password } from "../../utils/password";
import { BadRequestError, NotFoundError } from "../../common/errors";
import { UserPayload } from "../../common/types";
import { storeOtp, getOtp, clearOtp } from "../../config/redis";
import { sendSms } from "../notification/sms.service";

const repo = new AuthRepository();

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const signToken = (payload: UserPayload) => jwt.sign(payload, process.env.JWT_KEY!);

const sanitize = (user: any) => {
  const { passwordHash, ...rest } = user;
  return rest;
};

// ───────────── Worker registration + OTP ─────────────
export const registerWorker = async (email: string, password: string, phone: string) => {
  if (await repo.findByEmail(email)) throw new BadRequestError("Email already registered");
  if (await repo.findByPhone(phone)) throw new BadRequestError("Phone already registered");

  const passwordHash = await Password.toHash(password);
  const user = await repo.create({ email, passwordHash, phone, role: "worker", phoneVerified: false });

  const otp = generateOtp();
  await storeOtp(phone, otp);

  // Direct function call — no NATS, no Notification Service to wait on.
  await sendSms(phone, `Your SCN Jobs OTP is ${otp}. Valid for 5 minutes.`);

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
  return { token, user: sanitize(user) };
};

export const resendWorkerOtp = async (phone: string) => {
  const user = await repo.findByPhone(phone);
  if (!user) throw new NotFoundError("No registration found for this phone");

  const otp = generateOtp();
  await storeOtp(phone, otp);
  await sendSms(phone, `Your SCN Jobs OTP is ${otp}. Valid for 5 minutes.`);

  return {
    devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
  };
};

// ───────────── Login (all roles) ─────────────
// No more fetching the recruiter's categories from Admin Service over HTTP
// at login time — categories are checked live wherever they're needed
// (job.middlewares.categoryGuard, worker.service.searchWorkers) via a join.
export const login = async (email: string, password: string) => {
  const user = await repo.findByEmail(email);
  if (!user || !user.isActive) throw new BadRequestError("Invalid credentials");

  const passwordMatch = await Password.compare(user.passwordHash, password);
  if (!passwordMatch) throw new BadRequestError("Invalid credentials");

  if (user.role === "worker" && !user.phoneVerified) {
    throw new BadRequestError("Please verify your phone number first");
  }

  const token = signToken({ id: user.id, role: user.role as UserPayload["role"] });
  return { token, user: sanitize(user) };
};

// ───────────── Current user ─────────────
export const getCurrentUser = async (id: string) => {
  const user = await repo.findById(id);
  if (!user || !user.isActive) return null;
  return sanitize(user);
};
