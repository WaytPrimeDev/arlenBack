import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { isValidObjectId } from "mongoose";

export const isValidId = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw createHttpError(400, "Invalid id");
  next();
};
