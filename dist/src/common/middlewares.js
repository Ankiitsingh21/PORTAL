"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.validateRequest = exports.requireRole = exports.requireAuth = void 0;
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("./errors");
const requireAuth = (req, res, next) => {
    const token = req.session?.jwt;
    if (!token) {
        throw new errors_1.NotAuthorizedError();
    }
    try {
        req.currentUser = jsonwebtoken_1.default.verify(token, process.env.JWT_KEY);
    }
    catch {
        throw new errors_1.NotAuthorizedError();
    }
    next();
};
exports.requireAuth = requireAuth;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.currentUser || !roles.includes(req.currentUser.role)) {
            throw new errors_1.ForbiddenError(`Only ${roles.join(" or ")} can perform this action`);
        }
        next();
    };
};
exports.requireRole = requireRole;
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errors_1.RequestValidationError(errors.array());
    }
    next();
};
exports.validateRequest = validateRequest;
const errorHandler = (err, req, res, next) => {
    if (err instanceof errors_1.CustomError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.serializeErrors(),
        });
    }
    console.error(err);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errors: [{ message: "Something went wrong" }],
    });
};
exports.errorHandler = errorHandler;
