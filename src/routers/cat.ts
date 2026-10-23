import {
  addKittenController,
  addParentKittenController,
  getKittenByIdController,
  getKittensController,
  deleteParentController,
  deleteKittenController,
  getParentController,
  updateKittenController,
  updateParentController,
  getParentByIdController,
} from "../controllers/catControllers";
import { Router } from "express";
import { auth } from "../middlewares/auth";
import { isValidId } from "../middlewares/isValidId";
import { upload } from "../middlewares/multer";
import { ctrlWrapper } from "../utils/ctrlWrapper";
import { MAX_IMAGES } from "../utils/images";

export const catRouter = Router();

catRouter.post(
  "/kitten",
  auth,
  upload.array("images", MAX_IMAGES),
  ctrlWrapper(addKittenController),
);

catRouter.get("/kittens", auth, ctrlWrapper(getKittensController));
catRouter.get(
  "/kitten/:id",
  auth,
  isValidId,
  ctrlWrapper(getKittenByIdController),
);
catRouter.delete(
  "/kitten/:id",
  auth,
  isValidId,
  ctrlWrapper(deleteKittenController),
);

catRouter.post(
  "/parent",
  auth,
  upload.array("images", MAX_IMAGES),
  ctrlWrapper(addParentKittenController),
);
catRouter.get("/parents", auth, ctrlWrapper(getParentController));
catRouter.get(
  "/parent/:id",
  auth,
  isValidId,
  ctrlWrapper(getParentByIdController),
);
catRouter.delete(
  "/parent/:id",
  auth,
  isValidId,
  ctrlWrapper(deleteParentController),
);

catRouter.patch(
  "/kitten/:id",
  auth,
  isValidId,
  upload.array("images", MAX_IMAGES),
  ctrlWrapper(updateKittenController),
);

catRouter.patch(
  "/parent/:id",
  auth,
  isValidId,
  upload.array("images", MAX_IMAGES),
  ctrlWrapper(updateParentController),
);


// alert//
