"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.login = exports.resendWorkerOtp = exports.verifyWorkerOtp = exports.registerWorker = void 0;
const svc = __importStar(require("./auth.service"));
const registerWorker = async (req, res) => {
    const { email, password, phone } = req.body;
    const result = await svc.registerWorker(email, password, phone);
    res.status(201).send({ success: true, data: result, message: "OTP sent" });
};
exports.registerWorker = registerWorker;
const verifyWorkerOtp = async (req, res) => {
    const { phone, otp } = req.body;
    const result = await svc.verifyWorkerOtp(phone, otp);
    req.session = { jwt: result.token };
    res.send({ success: true, data: result });
};
exports.verifyWorkerOtp = verifyWorkerOtp;
const resendWorkerOtp = async (req, res) => {
    const result = await svc.resendWorkerOtp(req.body.phone);
    res.send({ success: true, data: result, message: "OTP resent" });
};
exports.resendWorkerOtp = resendWorkerOtp;
const login = async (req, res) => {
    const { email, password } = req.body;
    const result = await svc.login(email, password);
    req.session = { jwt: result.token };
    res.send({ success: true, data: result });
};
exports.login = login;
const logout = (req, res) => {
    req.session = null;
    res.send({ success: true });
};
exports.logout = logout;
const me = async (req, res) => {
    const user = await svc.getCurrentUser(req.currentUser.id);
    if (!user) {
        req.session = null;
        return res.send({ success: true, data: null });
    }
    res.send({ success: true, data: user });
};
exports.me = me;
