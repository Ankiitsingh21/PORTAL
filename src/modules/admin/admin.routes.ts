import express from "express";
import { body } from "express-validator";
import {
  requireAuth,
  requireRole,
  validateRequest,
} from "../../common/middlewares";
import * as ctrl from "./admin.controller";

const router = express.Router();

router.get(
  "/stats",
  requireAuth,
  requireRole("super_admin"),
  ctrl.getStats,
);

// ───────────── Recruiter management (super_admin only) ─────────────
router.post(
  "/recruiters",
  requireAuth,
  requireRole("super_admin"),
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("phone").optional({ nullable: true, checkFalsy: true }).trim(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be 6+ chars"),
    body("industryIds")
      .isArray({ min: 1 })
      .withMessage("At least one category is required"),
    body("industryIds.*").isInt().withMessage("Category ids must be numbers"),
  ],
  validateRequest,
  ctrl.createRecruiter,
);

router.get(
  "/recruiters",
  requireAuth,
  requireRole("super_admin"),
  ctrl.listRecruiters,
);

router.get(
  "/recruiters/:id",
  requireAuth,
  requireRole("super_admin"),
  ctrl.getRecruiter,
);

router.delete(
  "/recruiters/:id",
  requireAuth,
  requireRole("super_admin"),
  ctrl.deleteRecruiter,
);

router.patch(
  "/recruiters/:id",
  requireAuth,
  requireRole("super_admin"),
  ctrl.updateRecruiter,
);

router.patch(
  "/recruiters/:id/categories",
  requireAuth,
  requireRole("super_admin"),
  [
    body("industryIds")
      .isArray({ min: 1 })
      .withMessage("At least one category is required"),
    body("industryIds.*").isInt().withMessage("Category ids must be numbers"),
  ],
  validateRequest,
  ctrl.replaceCategories,
);

router.patch(
  "/recruiters/:id/deactivate",
  requireAuth,
  requireRole("super_admin"),
  ctrl.deactivateRecruiter,
);

router.patch(
  "/recruiters/:id/reactivate",
  requireAuth,
  requireRole("super_admin"),
  ctrl.reactivateRecruiter,
);

// NOTE: the old `/internal/recruiter-categories/:userId` route is gone.
// It only existed so Auth Service could fetch a recruiter's categories at
// login time to bake into the JWT. Categories are now checked live via a
// join wherever they matter — see job.middlewares.categoryGuard and
// worker.service.searchWorkers.

export default router;
