import express from "express";
import { body } from "express-validator";
import {
  requireAuth,
  requireRole,
  validateRequest,
} from "../../common/middlewares";
import * as ctrl from "./application.controller";

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requireRole("super_admin"),
  ctrl.listAllApplications,
);

router.post(
  "/",
  requireAuth,
  requireRole("worker"),
  [body("jobId").notEmpty()],
  validateRequest,
  ctrl.applyToJob,
);

router.get("/my", requireAuth, requireRole("worker"), ctrl.listMyApplications);

router.get(
  "/recruiter",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  ctrl.listRecruiterApplications,
);

router.get(
  "/job/:jobId",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  ctrl.listApplicationsForJob,
);

router.get(
  "/:id",
  requireAuth,
  requireRole("worker", "recruiter", "super_admin"),
  ctrl.getApplication,
);

router.patch(
  "/:id/status",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  [
    body("status").isIn([
      "shortlisted",
      "interview_scheduled",
      "hired",
      "rejected",
    ]),
  ],
  validateRequest,
  ctrl.updateStatus,
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("worker"),
  ctrl.withdrawApplication,
);

// NOTE: the old `/internal/by-jobs` and `/internal/by-recruiter/:id`
// routes are gone — Admin Service used these for reporting over HTTP.
// admin.service can just call application.service.listByJobIds /
// listByRecruiter directly if/when those reporting endpoints get built.

export default router;
