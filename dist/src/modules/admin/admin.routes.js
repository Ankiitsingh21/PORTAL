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
const ctrl = __importStar(require("./admin.controller"));
const router = express_1.default.Router();
// ───────────── Recruiter management (super_admin only) ─────────────
router.post("/recruiters", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), [
    (0, express_validator_1.body)("name").notEmpty().withMessage("Name is required"),
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email required"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be 6+ chars"),
    (0, express_validator_1.body)("industryIds")
        .isArray({ min: 1 })
        .withMessage("At least one category is required"),
], middlewares_1.validateRequest, ctrl.createRecruiter);
router.get("/recruiters", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), ctrl.listRecruiters);
router.get("/recruiters/:id", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), ctrl.getRecruiter);
router.patch("/recruiters/:id", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), ctrl.updateRecruiter);
router.patch("/recruiters/:id/categories", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), [
    (0, express_validator_1.body)("industryIds")
        .isArray({ min: 1 })
        .withMessage("At least one category is required"),
], middlewares_1.validateRequest, ctrl.replaceCategories);
router.patch("/recruiters/:id/deactivate", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), ctrl.deactivateRecruiter);
router.patch("/recruiters/:id/reactivate", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("super_admin"), ctrl.reactivateRecruiter);
// NOTE: the old `/internal/recruiter-categories/:userId` route is gone.
// It only existed so Auth Service could fetch a recruiter's categories at
// login time to bake into the JWT. Categories are now checked live via a
// join wherever they matter — see job.middlewares.categoryGuard and
// worker.service.searchWorkers.
exports.default = router;
