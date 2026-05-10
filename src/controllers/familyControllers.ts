import {
  createFamilyService,
  deleteFamilyService,
  getFamiliesServices,
  reorderFamiliesService,
  updateFamilyService,
} from "../services/familyServices";
import { Request, Response } from "express";
import createHttpError from "http-errors";

//<------------------------------------------------------------------------------------------------------>//
// СОЗДАНИЕ СЕМЬИ (Family)
//<------------------------------------------------------------------------------------------------------>//

export const createFamilyController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { name, parents, kittens, displayOrder = 0 } = req.body;

  if (!Array.isArray(kittens) || kittens.length === 0) {
    throw createHttpError(400, "Kittens must be a non-empty array");
  }

  const family = await createFamilyService({
    name,
    parents: {
      mom: parents?.mom || null,
      dad: parents?.dad || null,
    },
    kittens,
    displayOrder,
  });

  res.status(201).json({
    status: 201,
    message: "Family created successfully",
    data: family,
  });
};

export const getFamilyController = async (_req: Request, res: Response) => {
  const families = await getFamiliesServices();
  res.json({
    status: 200,
    message: "Families did find",
    data: families,
  });
};

//<------------------------------------------------------------------------------------------------------>//
// УДАЛЕНИЕ СЕМЬИ (Family)
//<------------------------------------------------------------------------------------------------------>//

export const deleteFamilyController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params as { id: string };

  const result = await deleteFamilyService(id);

  res.json({
    status: 200,
    message: result.message,
  });
};

//<------------------------------------------------------------------------------------------------------>//
// ОБНОВЛЕНИЕ СЕМЬИ (Family)
//<------------------------------------------------------------------------------------------------------>//

export const updateFamilyController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params as { id: string };

  // Парсим массивы, если они приходят как JSON-строки
  let parents = req.body.parents;
  if (parents && typeof parents === "string") {
    try {
      parents = JSON.parse(parents);
    } catch {
      // Если не JSON, оставляем как есть
    }
  }

  let kittens = req.body.kittens;
  if (kittens && typeof kittens === "string") {
    try {
      kittens = JSON.parse(kittens);
    } catch {
      // Если не JSON, оставляем как есть
    }
  }

  const updatedFamily = await updateFamilyService(id, {
    name: req.body.name,
    displayOrder: req.body.displayOrder,
    parents,
    kittens,
  });

  res.json({
    status: 200,
    message: "Family updated successfully",
    data: updatedFamily,
  });
};

export const reorderFamiliesController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw createHttpError(400, "Uncorect data format");
    }
    console.log(orderedIds);

    await reorderFamiliesService(orderedIds);

    res.status(200).json({ message: "Order was update" });
  } catch (error) {
    console.error("Ошибка при обновлении порядка:", error);
    throw createHttpError(500, "server eror");
  }
};
