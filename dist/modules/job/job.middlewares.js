"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryGuard = void 0;
const errors_1 = require("../../common/errors");
const job_service_1 = require("./job.service");
// Recruiters may only post/edit jobs in industries assigned to them by
// Admin. Super admins bypass this check entirely.
//
// The microservices version read `req.currentUser.assignedCategories`
// straight off the JWT, which was stamped in at login by an HTTP call to
// Admin Service. That meant a category change by Admin had no effect on a
// recruiter who was already logged in. This version queries
// RecruiterCategory live on every request — one extra join, but the check
// is always current, and there's no JWT payload to keep in sync.
const categoryGuard = async (req, res, next) => {
    if (req.currentUser.role === "super_admin")
        return next();
    const industryId = Number(req.body.industryId);
    const assigned = await (0, job_service_1.isRecruiterAssignedToIndustry)(req.currentUser.id, industryId);
    if (!assigned) {
        throw new errors_1.ForbiddenError("You are not authorized to post jobs in this category");
    }
    next();
};
exports.categoryGuard = categoryGuard;
