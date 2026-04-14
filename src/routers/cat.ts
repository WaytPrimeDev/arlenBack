import {
  addKittenController,
  getKittenByIdController,
  getKittenController,
} from "controllers/catControllers";
import { Router } from "express";
import { isValidId } from "middlewares/isValidId";
import { upload } from "middlewares/multer";
import { ctrlWrapper } from "utils/ctrlWrapper";

export const catRouter = Router();

catRouter.post(
  "/kitten",
  upload.array("images", 5),
  ctrlWrapper(addKittenController),
);

catRouter.get("/kitten", ctrlWrapper(getKittenController));
catRouter.get("/kitten/:id", isValidId, ctrlWrapper(getKittenByIdController));
