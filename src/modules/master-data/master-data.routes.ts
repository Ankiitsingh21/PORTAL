import express from "express";
import { body } from "express-validator";
import { requireAuth, requireRole, validateRequest } from "../../common/middlewares";
import * as ctrl from "./master-data.controller";
import * as svc from "./master-data.service";

const router = express.Router();

// ───────────── Locations ─────────────
router.get("/locations", requireAuth, ctrl.getLocations);
router.get("/locations/cities", requireAuth, ctrl.getCities);
router.get("/locations/:city/localities", requireAuth, ctrl.getLocalitiesByCity);

router.post(
  "/locations",
  requireAuth,
  requireRole("super_admin"),
  [body("state").notEmpty(), body("city").notEmpty(), body("locality").notEmpty()],
  validateRequest,
  ctrl.createLocation,
);

router.patch("/locations/:id", requireAuth, requireRole("super_admin"), ctrl.updateLocation);
router.delete("/locations/:id", requireAuth, requireRole("super_admin"), ctrl.deleteLocation);

// ───────────── Simple resources: industries, functions, skills, languages ─────────────
const simpleResources: [string, ReturnType<typeof ctrl.makeSimpleResourceHandlers>][] = [
  ["industries", ctrl.makeSimpleResourceHandlers(svc.industries)],
  ["functions", ctrl.makeSimpleResourceHandlers(svc.functions)],
  ["skills", ctrl.makeSimpleResourceHandlers(svc.skills)],
  ["languages", ctrl.makeSimpleResourceHandlers(svc.languages)],
];

for (const [path, handlers] of simpleResources) {
  router.get(`/${path}`, requireAuth, handlers.list);

  router.post(
    `/${path}`,
    requireAuth,
    requireRole("super_admin"),
    [body("name").notEmpty()],
    validateRequest,
    handlers.create,
  );

  router.patch(`/${path}/:id`, requireAuth, requireRole("super_admin"), handlers.update);
  router.delete(`/${path}/:id`, requireAuth, requireRole("super_admin"), handlers.remove);
}

// ───────────── Job roles ─────────────
router.get("/job-roles", requireAuth, ctrl.getJobRoles);

router.post(
  "/job-roles",
  requireAuth,
  requireRole("super_admin"),
  [body("name").notEmpty()],
  validateRequest,
  ctrl.createJobRole,
);

router.patch("/job-roles/:id", requireAuth, requireRole("super_admin"), ctrl.updateJobRole);
router.delete("/job-roles/:id", requireAuth, requireRole("super_admin"), ctrl.deleteJobRole);

// ───────────── Qualifications ─────────────
router.get("/qualifications", requireAuth, ctrl.getQualifications);

router.post(
  "/qualifications",
  requireAuth,
  requireRole("super_admin"),
  [body("name").notEmpty(), body("level").notEmpty()],
  validateRequest,
  ctrl.createQualification,
);

// NOTE: the old `/test-login` dev-only route is dropped — it minted a
// super_admin JWT with no credentials, fine for local testing inside a
// throwaway microservice, not something that should ship in a deliverable.

export default router;
