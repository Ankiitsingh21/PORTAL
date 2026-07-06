"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const db_1 = require("./config/db");
const redis_1 = require("./config/redis");
const start = async () => {
    if (!process.env.JWT_KEY)
        throw new Error("JWT_KEY must be defined");
    if (!process.env.DATABASE_URL)
        throw new Error("DATABASE_URL must be defined");
    if (!process.env.REDIS_URL)
        throw new Error("REDIS_URL must be defined");
    await (0, db_1.connectDB)();
    await redis_1.redis.ping();
    console.log("Redis connected");
    const port = Number(process.env.PORT) || 3000;
    app_1.app.listen(port, () => {
        console.log(`SCN Jobs monolith listening on ${port}`);
    });
};
start();
