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
const ctrl = __importStar(require("./application.controller"));
const router = express_1.default.Router();
router.post("/", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("worker"), [(0, express_validator_1.body)("jobId").notEmpty()], middlewares_1.validateRequest, ctrl.applyToJob);
router.get("/my", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("worker"), ctrl.listMyApplications);
router.get("/job/:jobId", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("recruiter", "super_admin"), ctrl.listApplicationsForJob);
router.get("/:id", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("worker", "recruiter", "super_admin"), ctrl.getApplication);
router.patch("/:id/status", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("recruiter", "super_admin"), [
    (0, express_validator_1.body)("status").isIn([
        "shortlisted",
        "interview_scheduled",
        "hired",
        "rejected",
    ]),
], middlewares_1.validateRequest, ctrl.updateStatus);
router.delete("/:id", middlewares_1.requireAuth, (0, middlewares_1.requireRole)("worker"), ctrl.withdrawApplication);
// NOTE: the old `/internal/by-jobs` and `/internal/by-recruiter/:id`
// routes are gone — Admin Service used these for reporting over HTTP.
// admin.service can just call application.service.listByJobIds /
// listByRecruiter directly if/when those reporting endpoints get built.
exports.default = router;
