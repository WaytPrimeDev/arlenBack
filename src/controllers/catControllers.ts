import { addKittenService, addParentKittenService } from "services/catServices";
import { Request, Response } from "express";
import createHttpError from "http-errors";
import { mapKitten } from "utils/mappers";

export const addParentKittenController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const parent = await addParentKittenService;
};

export const addKittenController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const files = req.files;
  const price = {
    breeding: req.body.breeding,
    pet: req.body.pet,
  };

  if (!Array.isArray(files)) throw createHttpError(400, "Photos are required");
  if (!files?.length) throw createHttpError(400, "Minimum 1 photo required");
  if (files.length > 5) throw createHttpError(400, "Maximum 5 photos allowed");

  const kitten = await addKittenService({ ...req.body, price }, files);

  res.json({
    message: "kitten was create",
    data: kitten,
  });
};
