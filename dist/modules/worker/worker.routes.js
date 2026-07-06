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
const ctrl = __importStar(require("./worker.controller"));
const router = express_1.default.Router();
// ───────────── Profile (own, worker only) ─────────────
router.post("/profile", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("worker"), ctrl.createProfile);
router.get("/profile", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("worker"), ctrl.getOwnProfile);
router.patch("/profile", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("worker"), ctrl.updateProfile);
// ───────────── Education ─────────────
router.post("/education", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("worker"), [(0, express_validator_1.body)("qualificationId").isInt().withMessage("qualificationId is required")], middlewares_1.validateRequest, ctrl.addEducation);
router.patch("/education/:id", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("worker"), ctrl.updateEducation);
router.delete("/education/:id", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("worker"), ctrl.deleteEducation);
// ───────────── Experience ─────────────
router.post("/experience", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("worker"), [
    (0, express_validator_1.body)("companyName").notEmpty(),
    (0, express_validator_1.body)("jobTitle").notEmpty(),
    (0, express_validator_1.body)("fromDate").notEmpty().withMessage("fromDate is required"),
], middlewares_1.validateRequest, ctrl.addExperience);
router.patch("/experience/:id", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("worker"), ctrl.updateExperience);
router.delete("/experience/:id", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("worker"), ctrl.deleteExperience);
// ───────────── Recruiter/Admin search ─────────────
router.get("/search", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("recruiter", "super_admin"), ctrl.searchWorkers);
router.get("/:id", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("recruiter", "super_admin"), ctrl.getWorkerById);
router.get("/by-user/:userId", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("recruiter", "super_admin"), ctrl.getWorkerByUserId);
exports.default = router;
