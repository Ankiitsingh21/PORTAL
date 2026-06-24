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
app.use(express_1.default.json());
app.use((0, cookie_session_1.default)({ signed: false, secure: false }));
app.use("/api", index_1.default);
app.use(middlewares_1.errorHandler);
