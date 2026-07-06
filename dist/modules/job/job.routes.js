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
const job_middlewares_1 = require("./job.middlewares");
const ctrl = __importStar(require("./job.controller"));
const router = express_1.default.Router();
// ───────────── Create job (recruiter or super_admin, category-guarded) ─────────────
router.post("/", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("recruiter", "super_admin"), [
    (0, express_validator_1.body)("title").notEmpty(),
    (0, express_validator_1.body)("industryId").isInt(),
    (0, express_validator_1.body)("locationId").isInt(),
    (0, express_validator_1.body)("headcountRequired").isInt({ min: 1 }),
], middlewares_1.validateRequest, job_middlewares_1.categoryGuard, ctrl.createJob);
// ───────────── List (role-aware) ─────────────
router.get("/", middlewares_1.loadCurrentUser, ctrl.listJobs);
// ───────────── Single job ─────────────
router.get("/:id", middlewares_1.loadCurrentUser, ctrl.getJob);
// ───────────── Edit (owner recruiter or admin) ─────────────
router.patch("/:id", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("recruiter", "super_admin"), ctrl.updateJob);
// ───────────── Status transitions ─────────────
router.patch("/:id/status", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("recruiter", "super_admin"), [(0, express_validator_1.body)("status").isIn(["draft", "active", "closed"])], middlewares_1.validateRequest, ctrl.updateJobStatus);
// ───────────── Delete (draft only) ─────────────
router.delete("/:id", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("recruiter", "super_admin"), ctrl.deleteJob);
// ───────────── Admin reassigns job to a different recruiter ─────────────
router.patch("/:id/assign", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), [(0, express_validator_1.body)("recruiterUserId").notEmpty()], middlewares_1.validateRequest, ctrl.assignJob);
// NOTE: the old `/internal/by-recruiter/:userId` and `/internal/:id`
// routes are gone. They existed only so Admin/Application Services could
// fetch job data over an unauthenticated internal HTTP call. In the
// monolith, application.service and admin.service just import
// job.service / job.repository directly — no network hop, and no
// unauthenticated surface to worry about.
exports.default = router;
