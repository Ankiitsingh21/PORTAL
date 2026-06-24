import express from "express";
import { body } from "express-validator";
import { requireAuth, validateRequest } from "../../common/middlewares";
import * as ctrl from "./auth.controller";

const router = express.Router();

// ───────────── Worker registration + OTP ─────────────
router.post(
  "/worker/register",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .trim()
      .isLength({ min: 6 })
      .withMessage("Password must be 6+ chars"),
    body("phone")
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage("Valid phone required"),
  ],
  validateRequest,
  ctrl.registerWorker,
);

router.post(
  "/worker/verify-otp",
  [body("phone").notEmpty(), body("otp").notEmpty()],
  validateRequest,
  ctrl.verifyWorkerOtp,
);

router.post(
  "/worker/resend-otp",
  [body("phone").notEmpty()],
  validateRequest,
  ctrl.resendWorkerOtp,
);

// ───────────── Login (worker / recruiter / super_admin) ─────────────
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  validateRequest,
  ctrl.login,
);

router.post("/logout", ctrl.logout);

router.get("/me", requireAuth, ctrl.me);

// NOTE: the old `/internal/create-user` route is gone — Admin Service used
// to call it over HTTP to create a recruiter's login. In the monolith,
// admin.service creates the User row directly inside the same Prisma
// transaction as the Recruiter profile. See modules/admin/admin.service.ts.

export default router;
