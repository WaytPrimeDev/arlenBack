import {
  addKittenService,
  addParentKittenService,
  getKittenService,
} from "services/catServices";
import { Request, Response } from "express";
import createHttpError from "http-errors";
import { parsePaginationParams } from "utils/parseParams/pagePaginationParams";

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

export const getKittenController = async (req: Request, res: Response) => {
  const { page = 1, perPage = 10 } = parsePaginationParams(
    req.query.page as string,
    req.query.perPage as string,
  );

  const kittens = await getKittenService(page, perPage);

  res.json({
    message: "get kitten",
    data: kittens,
  });
};
