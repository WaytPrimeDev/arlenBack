import {
  getBreedClientService,
  getColorsClientService,
} from "../../services/clientServices/filterClientServices";
import { Request, Response } from "express";

export const getColorsClientController = async (
  _req: Request,
  res: Response,
) => {
  const colors = await getColorsClientService();

  res.json({ status: 200, colors });
};

export const getBreedsClientController = async (
  _req: Request,
  res: Response,
) => {
  const breeds = await getBreedClientService();

  res.json({ status: 200, breeds });
};
