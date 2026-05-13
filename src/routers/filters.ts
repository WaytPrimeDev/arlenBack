import {
  createBreedController,
  createColorController,
  deleteBreedController,
  deleteColorController,
  getBreedController,
  getColorController,
} from "../controllers/filterController";
import { ctrlWrapper } from "../utils/ctrlWrapper";
import { Router } from "express";

export const filterRoute = Router();

filterRoute.get("/colors", ctrlWrapper(getColorController));
filterRoute.post("/color", ctrlWrapper(createColorController));
filterRoute.delete("/color/:id", ctrlWrapper(deleteColorController));

filterRoute.get("/breeds", ctrlWrapper(getBreedController));
filterRoute.post("/breed", ctrlWrapper(createBreedController));
filterRoute.delete("/breed/:id", ctrlWrapper(deleteBreedController));
