"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cookie_session_1 = __importDefault(require("cookie-session"));
const index_1 = __importDefault(require("./routes/index"));
const middlewares_1 = require("./common/middlewares");
const app = (0, express_1.default)();
exports.app = app;
app.set("trust proxy", true);
app.use((req, res, next) => {
    const configuredOrigins = (process.env.CORS_ORIGIN ??
        process.env.FRONTEND_URL ??
        "http://localhost:3001,http://localhost:3002,http://localhost:3003")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
    const requestOrigin = req.headers.origin;
    const allowAnyOrigin = configuredOrigins.includes("*");
    if (requestOrigin && (allowAnyOrigin || configuredOrigins.includes(requestOrigin))) {
        res.header("Access-Control-Allow-Origin", requestOrigin);
        res.header("Vary", "Origin");
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});
app.use(express_1.default.json());
app.use((0, cookie_session_1.default)({ signed: false, secure: false }));
app.use("/api", index_1.default);
app.use(middlewares_1.errorHandler);
