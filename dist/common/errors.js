"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestValidationError = exports.ForbiddenError = exports.NotAuthorizedError = exports.NotFoundError = exports.BadRequestError = exports.CustomError = void 0;
class CustomError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.CustomError = CustomError;
class BadRequestError extends CustomError {
    constructor(message) {
        super(message);
        this.statusCode = 400;
    }
    serializeErrors() {
        return [{ message: this.message }];
    }
}
exports.BadRequestError = BadRequestError;
class NotFoundError extends CustomError {
    constructor(message = "Not found") {
        super(message);
        this.statusCode = 404;
    }
    serializeErrors() {
        return [{ message: this.message }];
    }
}
exports.NotFoundError = NotFoundError;
class NotAuthorizedError extends CustomError {
    constructor() {
        super("Not authorized");
        this.statusCode = 401;
    }
    serializeErrors() {
        return [{ message: this.message }];
    }
}
exports.NotAuthorizedError = NotAuthorizedError;
class ForbiddenError extends CustomError {
    constructor(message = "Forbidden") {
        super(message);
        this.statusCode = 403;
    }
    serializeErrors() {
        return [{ message: this.message }];
    }
}
exports.ForbiddenError = ForbiddenError;
class RequestValidationError extends CustomError {
    constructor(errors) {
        super("Invalid request parameters");
        this.errors = errors;
        this.statusCode = 400;
    }
    serializeErrors() {
        return this.errors.map((err) => ({
            message: err.msg,
            field: err.path,
        }));
    }
}
exports.RequestValidationError = RequestValidationError;
