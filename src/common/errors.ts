import { ValidationError } from "express-validator";

export abstract class CustomError extends Error {
  abstract statusCode: number;
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
  abstract serializeErrors(): { message: string; field?: string }[];
}

export class BadRequestError extends CustomError {
  statusCode = 400;
  constructor(message: string) {
    super(message);
  }
  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class NotFoundError extends CustomError {
  statusCode = 404;
  constructor(message = "Not found") {
    super(message);
  }
  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class NotAuthorizedError extends CustomError {
  statusCode = 401;
  constructor() {
    super("Not authorized");
  }
  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class ForbiddenError extends CustomError {
  statusCode = 403;
  constructor(message = "Forbidden") {
    super(message);
  }
  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class RequestValidationError extends CustomError {
  statusCode = 400;
  constructor(private errors: ValidationError[]) {
    super("Invalid request parameters");
  }
  serializeErrors() {
    return this.errors.map((err: any) => ({
      message: err.msg,
      field: err.path,
    }));
  }
}
