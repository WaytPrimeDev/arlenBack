import { auth } from "@/middlewares/auth";
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

filterRoute.get("/colors", auth, ctrlWrapper(getColorController));
filterRoute.post("/color", auth, ctrlWrapper(createColorController));
filterRoute.delete("/color/:id", auth, ctrlWrapper(deleteColorController));

filterRoute.get("/breeds", auth, ctrlWrapper(getBreedController));
filterRoute.post("/breed", auth, ctrlWrapper(createBreedController));
filterRoute.delete("/breed/:id", auth, ctrlWrapper(deleteBreedController));
