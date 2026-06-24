"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearOtp = exports.getOtp = exports.storeOtp = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
// Redis is kept for exactly one job: OTP storage with a TTL. The
// microservices version also used it to cache Master Data reads — that
// cache is dropped here on purpose. At ~600 workers / a handful of
// recruiters, a straight Postgres read on dropdown data is fast enough,
// and one less moving part means less to break before delivery. Add the
// cache back later if traffic ever justifies it.
exports.redis = new ioredis_1.default(process.env.REDIS_URL);
const OTP_TTL_SECONDS = 300; // 5 minutes
const storeOtp = async (phone, otp) => {
    await exports.redis.set(`otp:${phone}`, otp, "EX", OTP_TTL_SECONDS);
};
exports.storeOtp = storeOtp;
const getOtp = async (phone) => {
    return exports.redis.get(`otp:${phone}`);
};
exports.getOtp = getOtp;
const clearOtp = async (phone) => {
    await exports.redis.del(`otp:${phone}`);
};
exports.clearOtp = clearOtp;
