"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRecruiterActive = exports.replaceCategories = exports.deleteRecruiter = exports.updateRecruiter = exports.getRecruiter = exports.listRecruiters = exports.createRecruiter = exports.getStats = void 0;
const db_1 = require("../../config/db");
const admin_repository_1 = require("./admin.repository");
const password_1 = require("../../utils/password");
const errors_1 = require("../../common/errors");
const repo = new admin_repository_1.AdminRepository();
const getStats = () => repo.getStats();
exports.getStats = getStats;
// ───────────── Create recruiter ─────────────
// Single Prisma transaction creates both the User (login) and the
// Recruiter profile + initial categories. In microservices this was two
// separate writes across two databases (HTTP call to Auth Service, then a
// local DB write) with no way to roll back the first if the second
// failed — a real ACID gap. This closes it.
const createRecruiter = async (name, email, phone, password, createdById, industryIds) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone?.trim() || undefined;
    const passwordHash = await password_1.Password.toHash(password);
    console.log(normalizedEmail);
    const recruiter = await db_1.prisma.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({ where: { email: normalizedEmail } });
        if (existing)
            throw new errors_1.BadRequestError("Email already registered");
        if (normalizedPhone) {
            const existingPhone = await tx.user.findUnique({ where: { phone: normalizedPhone } });
            if (existingPhone)
                throw new errors_1.BadRequestError("Phone already registered");
        }
        const user = await repo.createUserForRecruiter(tx, {
            email: normalizedEmail,
            phone: normalizedPhone,
            passwordHash,
        });
        // console.log(user);
        return repo.createRecruiterProfile(tx, {
            userId: user.id,
            name,
            email: normalizedEmail,
            createdById,
            industryIds,
        });
    });
    // The microservices Notification handler had a case for
    // "auth.recruiter.created" with an email + tempPassword payload, but
    // nothing ever published that event — admin.service.ts never imported
    // natsWrapper. Wiring it up here actually makes the recruiter find out
    // their own login.
    // try {
    //   await sendEmail(
    //     normalizedEmail,
    //     "Your SCN Jobs recruiter account",
    //     `Email: ${normalizedEmail}\nPassword: ${password}`,
    //   );
    // } catch (err) {
    //   console.error("Failed to send welcome email, but recruiter was created.", err);
    // }
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
const updateRecruiter = async (id, data) => {
    const recruiter = await repo.findRecruiterById(id);
    if (!recruiter)
        throw new errors_1.NotFoundError("Recruiter not found");
    const name = data.name?.trim();
    const email = data.email?.trim().toLowerCase();
    const phone = data.phone?.trim() || null;
    if (data.industryIds !== undefined && data.industryIds.length === 0) {
        throw new errors_1.BadRequestError("At least one category is required");
    }
    if (email && email !== recruiter.user.email) {
        const existing = await db_1.prisma.user.findUnique({ where: { email } });
        if (existing && existing.id !== recruiter.user.id) {
            throw new errors_1.BadRequestError("Email already registered");
        }
    }
    if (phone && phone !== recruiter.user.phone) {
        const existingPhone = await db_1.prisma.user.findUnique({ where: { phone } });
        if (existingPhone && existingPhone.id !== recruiter.user.id) {
            throw new errors_1.BadRequestError("Phone already registered");
        }
    }
    await repo.updateRecruiterInfo(id, {
        userId: recruiter.user.id,
        name,
        email,
        phone,
        industryIds: data.industryIds,
    });
    return (0, exports.getRecruiter)(id);
};
exports.updateRecruiter = updateRecruiter;
const deleteRecruiter = async (id) => {
    const recruiter = await repo.findRecruiterById(id);
    if (!recruiter)
        throw new errors_1.NotFoundError("Recruiter not found");
    const postedJobs = recruiter.user._count.jobsPosted;
    if (postedJobs > 0) {
        throw new errors_1.BadRequestError("Recruiters with posted jobs cannot be deleted. Deactivate the recruiter instead.");
    }
    await repo.deleteRecruiterAccount(id, recruiter.user.id);
    return { deleted: true };
};
exports.deleteRecruiter = deleteRecruiter;
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
