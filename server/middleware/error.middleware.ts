import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode = 400, details?: any) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorMiddleware(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  if (statusCode >= 500) {
    console.error("❌ [ServerError]:", err);
  }

  return res.status(statusCode).json({
    error: message,
    ...(err.details ? { details: err.details } : {}),
  });
}
