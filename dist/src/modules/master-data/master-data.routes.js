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
const ctrl = __importStar(require("./master-data.controller"));
const svc = __importStar(require("./master-data.service"));
const router = express_1.default.Router();
// ───────────── Locations ─────────────
router.get("/locations", middlewares_1.requireAuth, ctrl.getLocations);
router.get("/locations/cities", middlewares_1.requireAuth, ctrl.getCities);
router.get("/locations/:city/localities", middlewares_1.requireAuth, ctrl.getLocalitiesByCity);
router.post("/locations", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), [
    (0, express_validator_1.body)("state").notEmpty(),
    (0, express_validator_1.body)("city").notEmpty(),
    (0, express_validator_1.body)("locality").notEmpty(),
], middlewares_1.validateRequest, ctrl.createLocation);
router.patch("/locations/:id", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), ctrl.updateLocation);
router.delete("/locations/:id", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), ctrl.deleteLocation);
// ───────────── Simple resources: industries, functions, skills, languages ─────────────
const simpleResources = [
    ["industries", ctrl.makeSimpleResourceHandlers(svc.industries)],
    ["functions", ctrl.makeSimpleResourceHandlers(svc.functions)],
    ["skills", ctrl.makeSimpleResourceHandlers(svc.skills)],
    ["languages", ctrl.makeSimpleResourceHandlers(svc.languages)],
];
for (const [path, handlers] of simpleResources) {
    router.get(`/${path}`, middlewares_1.requireAuth, handlers.list);
    router.post(`/${path}`, middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), [(0, express_validator_1.body)("name").notEmpty()], middlewares_1.validateRequest, handlers.create);
    router.patch(`/${path}/:id`, middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), handlers.update);
    router.delete(`/${path}/:id`, middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), handlers.remove);
}
// ───────────── Job roles ─────────────
router.get("/job-roles", middlewares_1.requireAuth, ctrl.getJobRoles);
router.post("/job-roles", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), [(0, express_validator_1.body)("name").notEmpty()], middlewares_1.validateRequest, ctrl.createJobRole);
router.patch("/job-roles/:id", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), ctrl.updateJobRole);
router.delete("/job-roles/:id", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), ctrl.deleteJobRole);
// ───────────── Qualifications ─────────────
router.get("/qualifications", middlewares_1.requireAuth, ctrl.getQualifications);
router.post("/qualifications", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), [(0, express_validator_1.body)("name").notEmpty(), (0, express_validator_1.body)("level").notEmpty()], middlewares_1.validateRequest, ctrl.createQualification);
// NOTE: the old `/test-login` dev-only route is dropped — it minted a
// super_admin JWT with no credentials, fine for local testing inside a
// throwaway microservice, not something that should ship in a deliverable.
exports.default = router;
