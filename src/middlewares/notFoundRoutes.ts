import createHttpError from "http-errors";
import { Request, Response, NextFunction } from "express";

export const notFoundRoutes = (
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  next(createHttpError(404, "Route not found"));
};
