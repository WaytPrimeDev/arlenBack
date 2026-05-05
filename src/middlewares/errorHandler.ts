import { Request, Response, NextFunction } from "express";

interface HttpError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (
  err: HttpError | unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const error = err as HttpError;

  const status = error.status || 500;

  res.status(status).json({
    success: false,
    message: error.message || "Internal Server Error",
    code: error.code || undefined,
  });
};
