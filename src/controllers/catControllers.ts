import { parsePaginationParams } from "../utils/parseParams/pagePaginationParams";
import {
  addKittenService,
  addParentKittenService,
  getKittenByIdService,
  getKittensService,
  deleteParentService,
  deleteKittenService,
  getParentService,
  updateKittenService,
  updateParentService,
  getParentByIdService,
} from "../services/catServices";
import { Request, Response } from "express";
import createHttpError from "http-errors";
import { z } from "zod";
import { assertImageCount, removeTempFiles } from "../utils/images";
import {
  updateKittenSchema,
  updateParentSchema,
} from "../validation/catSchemas";

export const getParentController = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const parents = await getParentService();

  res.json({
    status: 200,
    message: "parent did find",
    data: parents,
  });
};

export const addParentKittenController = async (
  request: Request,
  res: Response,
): Promise<void> => {
  const files = request.files;

  if (!Array.isArray(files)) throw createHttpError(400, "Photos are required");
  assertImageCount(files.length);

  const parent = await addParentKittenService(request.body, files);
  res.json({
    status: 200,
    data: parent,
  });
};

//<--------------------------------------------------------------------------------------------------->//

export const addKittenController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const files = req.files;
  const parentId = {
    mom: req.body.mom?.toString() || null,
    dad: req.body.dad?.toString() || null,
  };
  const price = {
    breeding: req.body.breeding || null,
    pet: req.body.pet || null,
  };

  if (!Array.isArray(files)) throw createHttpError(400, "Photos are required");
  assertImageCount(files.length);

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

export const getParentByIdController = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const parent = await getParentByIdService(id);
  res.json({
    message: "get kitten by id",
    data: parent,
  });
};

export const getKittensController = async (req: Request, res: Response) => {
  const { page = 1, perPage = 20 } = parsePaginationParams(
    req.query.page as string,
    req.query.perPage as string,
  );

  const kittens = await getKittensService(page, perPage);

  res.json({
    message: "get kitten",
    data: kittens,
  });
};

//<--------------------------------------------------------------------------------------------------->//
// УДАЛЕНИЕ РОДИТЕЛЯ (Parent)
//<--------------------------------------------------------------------------------------------------->//

export const deleteParentController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params as { id: string };

  const result = await deleteParentService(id);

  res.json({
    status: 200,
    message: result.message,
  });
};

//<--------------------------------------------------------------------------------------------------->//
// УДАЛЕНИЕ КОТЕНКА (Kitten)
//<--------------------------------------------------------------------------------------------------->//

export const deleteKittenController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params as { id: string };

  const result = await deleteKittenService(id);

  res.json({
    status: 200,
    message: result.message,
  });
};

//<--------------------------------------------------------------------------------------------------->//
// ОБНОВЛЕНИЕ РОДИТЕЛЯ (Parent)
//<--------------------------------------------------------------------------------------------------->//

export const updateParentController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params as { id: string };
  const files = (req.files as Express.Multer.File[]) || [];

  const parsed = updateParentSchema.safeParse(req.body);
  if (!parsed.success) {
    await removeTempFiles(files);
    throw createHttpError(400, z.prettifyError(parsed.error));
  }

  const updatedParent = await updateParentService(id, parsed.data, files);

  res.json({
    status: 200,
    message: "Parent updated successfully",
    data: updatedParent,
  });
};

//<--------------------------------------------------------------------------------------------------->//
// ОБНОВЛЕНИЕ КОТЕНКА (Kitten)
//<--------------------------------------------------------------------------------------------------->//

export const updateKittenController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params as { id: string };
  const files = (req.files as Express.Multer.File[]) || [];

  const parsed = updateKittenSchema.safeParse(req.body);
  if (!parsed.success) {
    await removeTempFiles(files);
    throw createHttpError(400, z.prettifyError(parsed.error));
  }

  const updatedKitten = await updateKittenService(id, parsed.data, files);

  res.json({
    status: 200,
    message: "Kitten updated successfully",
    data: updatedKitten,
  });
};
