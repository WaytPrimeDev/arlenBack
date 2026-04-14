import {
  addKittenService,
  addParentKittenService,
  getKittenByIdService,
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
  const parentId = {
    mom: req.body.momId?.toString() || null,
    dad: req.body.dadId?.toString() || null,
  };
  const price = {
    breeding: req.body.breeding,
    pet: req.body.pet,
  };

  if (!Array.isArray(files)) throw createHttpError(400, "Photos are required");
  if (!files?.length) throw createHttpError(400, "Minimum 1 photo required");
  if (files.length > 5) throw createHttpError(400, "Maximum 5 photos allowed");

  const kitten = await addKittenService(
    { ...req.body, price, parentId },
    files,
  );

  res.json({
    message: "kitten was create",
    data: kitten,
  });
};

export const getKittenByIdController = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const kitten = await getKittenByIdService(id);

  res.json({
    message: "get kitten by id",
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
