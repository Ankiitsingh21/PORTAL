"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRecruiterActive = exports.replaceCategories = exports.updateRecruiter = exports.getRecruiter = exports.listRecruiters = exports.createRecruiter = exports.getStats = void 0;
const db_1 = require("../../config/db");
const admin_repository_1 = require("./admin.repository");
const password_1 = require("../../utils/password");
const errors_1 = require("../../common/errors");
const email_service_1 = require("../notification/email.service");
const repo = new admin_repository_1.AdminRepository();
const getStats = () => repo.getStats();
exports.getStats = getStats;
// ───────────── Create recruiter ─────────────
// Single Prisma transaction creates both the User (login) and the
// Recruiter profile + initial categories. In microservices this was two
// separate writes across two databases (HTTP call to Auth Service, then a
// local DB write) with no way to roll back the first if the second
// failed — a real ACID gap. This closes it.
const createRecruiter = async (name, email, password, createdById, industryIds) => {
    const passwordHash = await password_1.Password.toHash(password);
    const recruiter = await db_1.prisma.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({ where: { email } });
        if (existing)
            throw new errors_1.BadRequestError("Email already registered");
        const user = await repo.createUserForRecruiter(tx, { email, passwordHash });
        // console.log(user);
        return repo.createRecruiterProfile(tx, {
            userId: user.id,
            name,
            email,
            createdById,
            industryIds,
        });
    });
    // The microservices Notification handler had a case for
    // "auth.recruiter.created" with an email + tempPassword payload, but
    // nothing ever published that event — admin.service.ts never imported
    // natsWrapper. Wiring it up here actually makes the recruiter find out
    // their own login.
    await (0, email_service_1.sendEmail)(email, "Your SCN Jobs recruiter account", `Email: ${email}\nPassword: ${password}`);
    return recruiter;
};
exports.createRecruiter = createRecruiter;
// ───────────── List / get ─────────────
const listRecruiters = () => repo.listRecruiters();
exports.listRecruiters = listRecruiters;
const getRecruiter = async (id) => {
    const recruiter = await repo.findRecruiterById(id);
    if (!recruiter)
        throw new errors_1.NotFoundError("Recruiter not found");
    return recruiter;
};
exports.getRecruiter = getRecruiter;
// ───────────── Update basic info ─────────────
const updateRecruiter = (id, data) => repo.updateRecruiterInfo(id, data);
exports.updateRecruiter = updateRecruiter;
// ───────────── Full replace categories ─────────────
const replaceCategories = async (recruiterId, industryIds) => {
    const recruiter = await repo.findRecruiterById(recruiterId);
    if (!recruiter)
        throw new errors_1.NotFoundError("Recruiter not found");
    await repo.replaceCategories(recruiterId, industryIds);
    return (0, exports.getRecruiter)(recruiterId);
};
exports.replaceCategories = replaceCategories;
// ───────────── Activate / deactivate ─────────────
const setRecruiterActive = (id, isActive) => repo.setRecruiterActive(id, isActive);
exports.setRecruiterActive = setRecruiterActive;
