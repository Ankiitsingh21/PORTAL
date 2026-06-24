import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import {
  CustomError,
  ForbiddenError,
  NotAuthorizedError,
  RequestValidationError,
} from "./errors";
import { UserPayload } from "./types";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.session?.jwt;
  if (!token) {
    throw new NotAuthorizedError();
  }
  try {
    req.currentUser = jwt.verify(token, process.env.JWT_KEY!) as UserPayload;
  } catch {
    throw new NotAuthorizedError();
  }
  next();
};

export const requireRole = (...roles: UserPayload["role"][]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.currentUser || !roles.includes(req.currentUser.role)) {
      throw new ForbiddenError(
        `Only ${roles.join(" or ")} can perform this action`,
      );
    }
    next();
  };
};

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new RequestValidationError(errors.array());
  }
  next();
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof CustomError) {
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
