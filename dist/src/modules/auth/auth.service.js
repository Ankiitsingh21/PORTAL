"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.login = exports.resendWorkerOtp = exports.verifyWorkerOtp = exports.registerWorker = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_repository_1 = require("./auth.repository");
const password_1 = require("../../utils/password");
const errors_1 = require("../../common/errors");
const redis_1 = require("../../config/redis");
const sms_service_1 = require("../notification/sms.service");
const email_service_1 = require("../notification/email.service");
const repo = new auth_repository_1.AuthRepository();
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const signToken = (payload) => jsonwebtoken_1.default.sign(payload, process.env.JWT_KEY);
const sanitize = (user) => {
    const { passwordHash, ...rest } = user;
    return rest;
};
// ───────────── Worker registration + OTP ─────────────
const registerWorker = async (email, password, phone) => {
    if (await repo.findByEmail(email))
        throw new errors_1.BadRequestError("Email already registered");
    if (await repo.findByPhone(phone))
        throw new errors_1.BadRequestError("Phone already registered");
    const passwordHash = await password_1.Password.toHash(password);
    const user = await repo.create({
        email,
        passwordHash,
        phone,
        role: "worker",
        phoneVerified: false,
    });
    const otp = generateOtp();
    await (0, redis_1.storeOtp)(phone, otp);
    // Send OTP via both SMS and email — whichever reaches the user first
    await Promise.allSettled([
        // sendSms(phone, otp),
        (0, email_service_1.sendEmail)(email, "Your SCN Jobs OTP", `Your OTP is: ${otp}\n\nValid for 5 minutes. Do not share this with anyone.`, `<p>Your SCN Jobs OTP is: <strong style="font-size:24px">${otp}</strong></p><p>Valid for 5 minutes. Do not share this with anyone.</p>`),
    ]);
    return {
        userId: user.id,
        devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
    };
};
exports.registerWorker = registerWorker;
const verifyWorkerOtp = async (phone, otp) => {
    const storedOtp = await (0, redis_1.getOtp)(phone);
    if (!storedOtp || storedOtp !== otp) {
        throw new errors_1.BadRequestError("Invalid or expired OTP");
    }
    const user = await repo.markPhoneVerified(phone);
    await (0, redis_1.clearOtp)(phone);
    const token = signToken({ id: user.id, role: "worker" });
    return { token, user: sanitize(user) };
};
exports.verifyWorkerOtp = verifyWorkerOtp;
const resendWorkerOtp = async (phone) => {
    const user = await repo.findByPhone(phone);
    if (!user)
        throw new errors_1.NotFoundError("No registration found for this phone");
    const otp = generateOtp();
    await (0, redis_1.storeOtp)(phone, otp);
    await Promise.allSettled([
        (0, sms_service_1.sendSms)(phone, otp),
        (0, email_service_1.sendEmail)(user.email, "Your SCN Jobs OTP (Resent)", `Your OTP is: ${otp}\n\nValid for 5 minutes.`, `<p>Your SCN Jobs OTP is: <strong style="font-size:24px">${otp}</strong></p><p>Valid for 5 minutes.</p>`),
    ]);
    return {
        devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
    };
};
exports.resendWorkerOtp = resendWorkerOtp;
// ───────────── Login (all roles) ─────────────
// No more fetching the recruiter's categories from Admin Service over HTTP
// at login time — categories are checked live wherever they're needed
// (job.middlewares.categoryGuard, worker.service.searchWorkers) via a join.
const login = async (email, password) => {
    const user = await repo.findByEmail(email);
    if (!user || !user.isActive)
        throw new errors_1.BadRequestError("Invalid credentials");
    const passwordMatch = await password_1.Password.compare(user.passwordHash, password);
    if (!passwordMatch)
        throw new errors_1.BadRequestError("Invalid credentials");
    if (user.role === "worker" && !user.phoneVerified) {
        throw new errors_1.BadRequestError("Please verify your phone number first");
    }
    const token = signToken({
        id: user.id,
        role: user.role,
    });
    return { token, user: sanitize(user) };
};
exports.login = login;
// ───────────── Current user ─────────────
const getCurrentUser = async (id) => {
    const user = await repo.findById(id);
    if (!user || !user.isActive)
        return null;
    return sanitize(user);
};
exports.getCurrentUser = getCurrentUser;
