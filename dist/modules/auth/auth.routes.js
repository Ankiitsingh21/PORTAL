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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const middlewares_1 = require("../../common/middlewares");
const ctrl = __importStar(require("./auth.controller"));
const router = express_1.default.Router();
// ───────────── Worker registration + OTP ─────────────
router.post("/worker/register", [
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email required"),
    (0, express_validator_1.body)("name").optional().trim().isLength({ min: 2 }).withMessage("Name must be 2+ chars"),
    (0, express_validator_1.body)("password")
        .trim()
        .isLength({ min: 6 })
        .withMessage("Password must be 6+ chars"),
    (0, express_validator_1.body)("phone")
        .trim()
        .isLength({ min: 10, max: 15 })
        .withMessage("Valid phone required"),
], middlewares_1.validateRequest, ctrl.registerWorker);
router.post("/worker/verify-otp", [(0, express_validator_1.body)("phone").notEmpty(), (0, express_validator_1.body)("otp").notEmpty()], middlewares_1.validateRequest, ctrl.verifyWorkerOtp);
router.post("/worker/resend-otp", [(0, express_validator_1.body)("phone").notEmpty()], middlewares_1.validateRequest, ctrl.resendWorkerOtp);
// ───────────── Login (worker / recruiter / super_admin) ─────────────
router.post("/login", [
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email required"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password required"),
], middlewares_1.validateRequest, ctrl.login);
router.post("/logout", ctrl.logout);
router.get("/me", middlewares_1.requireAuth, ctrl.me);
router.get("/onboarding-status", middlewares_1.requireAuth, ctrl.getOnboardingStatus);
// NOTE: the old `/internal/create-user` route is gone — Admin Service used
// to call it over HTTP to create a recruiter's login. In the monolith,
// admin.service creates the User row directly inside the same Prisma
// transaction as the Recruiter profile. See modules/admin/admin.service.ts.
exports.default = router;
