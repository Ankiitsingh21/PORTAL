"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnboardingStatus = exports.getCurrentUser = exports.login = exports.resendWorkerOtp = exports.verifyWorkerOtp = exports.registerWorker = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_repository_1 = require("./auth.repository");
const password_1 = require("../../utils/password");
const errors_1 = require("../../common/errors");
const redis_1 = require("../../config/redis");
const repo = new auth_repository_1.AuthRepository();
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const signToken = (payload) => jsonwebtoken_1.default.sign(payload, process.env.JWT_KEY);
const sanitize = (user) => {
    const { passwordHash, workerProfile, ...rest } = user;
    return rest;
};
// Registration only ever collects a single "name" field (WorkerProfile.name).
// verify-otp needs firstName/lastName separately, so split it here instead
// of touching the registration flow at all.
const splitName = (fullName) => {
    if (!fullName || !fullName.trim())
        return { firstName: "", lastName: "" };
    const parts = fullName.trim().split(/\s+/);
    return {
        firstName: parts[0],
        lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
    };
};
// ───────────── Worker registration + OTP ─────────────
const registerWorker = async (email, password, phone, name) => {
    if (await repo.findByEmail(email))
        throw new errors_1.BadRequestError("Email already registered");
    if (await repo.findByPhone(phone))
        throw new errors_1.BadRequestError("Phone already registered");
    const passwordHash = await password_1.Password.toHash(password);
    const user = await repo.createWorkerAccount({
        email,
        passwordHash,
        phone,
        name,
    });
    const otp = generateOtp();
    await (0, redis_1.storeOtp)(phone, otp);
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
    const { firstName, lastName } = splitName(user.workerProfile?.name);
    return { token, user: sanitize(user), firstName, lastName };
};
exports.verifyWorkerOtp = verifyWorkerOtp;
const resendWorkerOtp = async (phone) => {
    const user = await repo.findByPhone(phone);
    if (!user)
        throw new errors_1.NotFoundError("No registration found for this phone");
    const otp = generateOtp();
    await (0, redis_1.storeOtp)(phone, otp);
    return {
        devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
    };
};
exports.resendWorkerOtp = resendWorkerOtp;
// ───────────── Login (all roles) ─────────────
// ───────────── Login (all roles) ─────────────
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
    // Reuse the same logic the dedicated /onboarding-status endpoint uses,
    // so login and that endpoint can never disagree with each other.
    const { needsOnboarding } = await (0, exports.getOnboardingStatus)(user.id, user.role);
    return { token, user: sanitize(user), needsOnboarding };
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
// ───────────── Onboarding status ─────────────
// Driven off WorkerProfile.profileComplete — the same flag worker.service
// already flips to true once name/phone/resume/skills are all filled in.
//   - no profile row yet      -> needsOnboarding: true
//   - profile incomplete      -> needsOnboarding: true
//   - profile marked complete -> needsOnboarding: false, forever, until
//     something makes it incomplete again.
const getOnboardingStatus = async (userId, role) => {
    if (role !== "worker") {
        return { needsOnboarding: false };
    }
    const profile = await repo.findWorkerProfileCompletion(userId);
    if (!profile)
        return { needsOnboarding: true };
    return { needsOnboarding: !profile.profileComplete };
};
exports.getOnboardingStatus = getOnboardingStatus;
