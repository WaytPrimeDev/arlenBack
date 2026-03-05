import createHttpError from "http-errors";
import { Request, Response, NextFunction } from "express";
import { RequestHandler } from "express-serve-static-core";

type Controller = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export const ctrlWrapper = (controller: Controller): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await controller(req, res, next);
    } catch (error: unknown) {
      if (error instanceof createHttpError.HttpError) {
        return next(error);
      }

      if (error instanceof Error) {
        return next(createHttpError(500, error.message));
      }

      next(createHttpError(500, "Unknown error"));
    }
  };
};
