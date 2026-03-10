import { addKittenController } from "controllers/catControllers";
import { Router } from "express";
import { upload } from "middlewares/multer";
import { ctrlWrapper } from "utils/ctrlWrapper";

export const catRouter = Router();

catRouter.post(
  "/kitten",
  upload.array("images", 5),
  ctrlWrapper(addKittenController),
);
