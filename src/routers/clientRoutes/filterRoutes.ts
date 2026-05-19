import { Router } from "express";
import { ctrlWrapper } from "../../utils/ctrlWrapper";
import {
  getBreedsClientController,
  getColorsClientController,
} from "../../controllers/clientController/filterClientController";

export const filterClientRoutes = Router();

filterClientRoutes.get("/colors", ctrlWrapper(getColorsClientController));
filterClientRoutes.get("/breeds", ctrlWrapper(getBreedsClientController));
