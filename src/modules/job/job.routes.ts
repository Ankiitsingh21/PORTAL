import express from "express";
import { body } from "express-validator";
import {
  loadCurrentUser,
  requireAuth,
  requireRole,
  validateRequest,
} from "../../common/middlewares";
import { categoryGuard } from "./job.middlewares";
import * as ctrl from "./job.controller";

const router = express.Router();

// ───────────── Create job (recruiter or super_admin, category-guarded) ─────────────
router.post(
  "/",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  [
    body("title").notEmpty(),
    body("industryId").isInt(),
    body("locationId").isInt(),
    body("headcountRequired").isInt({ min: 1 }),
  ],
  validateRequest,
  categoryGuard,
  ctrl.createJob,
);

// ───────────── List (role-aware) ─────────────
router.get("/", loadCurrentUser, ctrl.listJobs);

// ───────────── Single job ─────────────
router.get("/:id", loadCurrentUser, ctrl.getJob);

// ───────────── Edit (owner recruiter or admin) ─────────────
router.patch(
  "/:id",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  ctrl.updateJob,
);

// ───────────── Status transitions ─────────────
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  [body("status").isIn(["draft", "active", "closed"])],
  validateRequest,
  ctrl.updateJobStatus,
);

// ───────────── Delete (draft only) ─────────────
router.delete(
  "/:id",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  ctrl.deleteJob,
);

// ───────────── Admin reassigns job to a different recruiter ─────────────
router.patch(
  "/:id/assign",
  requireAuth,
  requireRole("super_admin"),
  [body("recruiterUserId").notEmpty()],
  validateRequest,
  ctrl.assignJob,
);

// NOTE: the old `/internal/by-recruiter/:userId` and `/internal/:id`
// routes are gone. They existed only so Admin/Application Services could
// fetch job data over an unauthenticated internal HTTP call. In the
// monolith, application.service and admin.service just import
// job.service / job.repository directly — no network hop, and no
// unauthenticated surface to worry about.

export default router;
