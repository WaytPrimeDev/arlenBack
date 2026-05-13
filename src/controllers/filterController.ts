import {
    createBreedService,
  createColorService,
  deleteBreedService,
  deleteColorService,
  getBreedService,
  getColorService,
} from "../services/filterService";
import { Request, Response } from "express";

export const getColorController = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const color = await getColorService();
  res.json({
    status: 200,
    data: color,
  });
};

export const createColorController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const color = await createColorService(req.body);
  res.json({
    status: 200,
    data: color,
  });
};

export const deleteColorController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params as { id: string };
  console.log(id);

  await deleteColorService(id);
  res.json({
    status: 204,
  });
};

export const getBreedController = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const breed = await getBreedService();
  res.json({
    status: 200,
    data: breed,
  });
};

export const createBreedController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const breed = await createBreedService(req.body);
  res.json({
    status: 200,
    data: breed,
  });
};

export const deleteBreedController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params as { id: string };

  await deleteBreedService(id);
  res.json({
    status: 204,
  });
};
