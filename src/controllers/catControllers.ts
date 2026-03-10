import { addKittenService } from "services/catServices";
import { Request, Response } from "express";
import createHttpError from "http-errors";

export const addKittenController = async (req: Request, res: Response) => {
  const files = req.files;

  if (!Array.isArray(files)) throw createHttpError(400, "Photos are required");
  if (!files?.length) throw createHttpError(400, "Minimum 1 photo required");
  if (files.length > 5) throw createHttpError(400, "Maximum 5 photos allowed");

  const kitten = await addKittenService(req.body, files);
  res.json({
    message: "kitten was create",
    data: kitten,
  });
};
