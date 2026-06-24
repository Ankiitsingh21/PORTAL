import Redis from "ioredis";

// Redis is kept for exactly one job: OTP storage with a TTL. The
// microservices version also used it to cache Master Data reads — that
// cache is dropped here on purpose. At ~600 workers / a handful of
// recruiters, a straight Postgres read on dropdown data is fast enough,
// and one less moving part means less to break before delivery. Add the
// cache back later if traffic ever justifies it.
export const redis = new Redis(process.env.REDIS_URL!);

const OTP_TTL_SECONDS = 300; // 5 minutes

export const storeOtp = async (phone: string, otp: string) => {
  await redis.set(`otp:${phone}`, otp, "EX", OTP_TTL_SECONDS);
};

export const getOtp = async (phone: string) => {
  return redis.get(`otp:${phone}`);
};

export const clearOtp = async (phone: string) => {
  await redis.del(`otp:${phone}`);
};
