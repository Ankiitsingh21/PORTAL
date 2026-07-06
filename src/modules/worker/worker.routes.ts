import express from "express";
import { body } from "express-validator";
import {
  requireAuth,
  requireRole,
  validateRequest,
} from "../../common/middlewares";
import * as ctrl from "./worker.controller";

const router = express.Router();

// ───────────── Profile (own, worker only) ─────────────
router.post("/profile", requireAuth, requireRole("worker"), ctrl.createProfile);
router.get("/profile", requireAuth, requireRole("worker"), ctrl.getOwnProfile);
router.patch(
  "/profile",
  requireAuth,
  requireRole("worker"),
  ctrl.updateProfile,
);

// ───────────── Education ─────────────
router.post(
  "/education",
  requireAuth,
  requireRole("worker"),
  [body("qualificationId").isInt().withMessage("qualificationId is required")],
  validateRequest,
  ctrl.addEducation,
);
router.patch(
  "/education/:id",
  requireAuth,
  requireRole("worker"),
  ctrl.updateEducation,
);
router.delete(
  "/education/:id",
  requireAuth,
  requireRole("worker"),
  ctrl.deleteEducation,
);

// ───────────── Experience ─────────────
router.post(
  "/experience",
  requireAuth,
  requireRole("worker"),
  [
    body("companyName").notEmpty(),
    body("jobTitle").notEmpty(),
    body("fromDate").notEmpty().withMessage("fromDate is required"),
  ],
  validateRequest,
  ctrl.addExperience,
);
router.patch(
  "/experience/:id",
  requireAuth,
  requireRole("worker"),
  ctrl.updateExperience,
);
router.delete(
  "/experience/:id",
  requireAuth,
  requireRole("worker"),
  ctrl.deleteExperience,
);

// ───────────── Recruiter/Admin search ─────────────
router.get(
  "/search",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  ctrl.searchWorkers,
);
router.get(
  "/:id",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  ctrl.getWorkerById,
);

router.get(
  "/by-user/:userId",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  ctrl.getWorkerByUserId,
);

export default router;
