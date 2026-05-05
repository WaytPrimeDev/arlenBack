import {
  addKittenController,
  addParentKittenController,
  getKittenByIdController,
  getKittenController,
  deleteParentController,
  deleteKittenController,
  getParentController,
  updateKittenController,
  updateParentController,
} from "controllers/catControllers";
import { Router } from "express";
import { auth } from "middlewares/auth";
import { isValidId } from "middlewares/isValidId";
import { upload } from "middlewares/multer";
import { ctrlWrapper } from "utils/ctrlWrapper";

export const catRouter = Router();

catRouter.post(
  "/kitten",
  auth,
  upload.array("images", 5),
  ctrlWrapper(addKittenController),
);

catRouter.get("/kittens", ctrlWrapper(getKittenController));
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
  upload.array("images", 5),
  ctrlWrapper(addParentKittenController),
);
catRouter.get("/parents", auth, ctrlWrapper(getParentController));
catRouter.delete(
  "/parent/:id",
  auth,
  isValidId,
  ctrlWrapper(deleteParentController),
);

//<--------------------------------------------------------------------------------------------------->//
// ОБНОВЛЕНИЕ КОТЯТ И РОДИТЕЛЕЙ
//<--------------------------------------------------------------------------------------------------->//

catRouter.patch(
  "/kitten/:id",
  auth,
  isValidId,
  upload.array("images", 5),
  ctrlWrapper(updateKittenController),
);

catRouter.patch(
  "/parent/:id",
  auth,
  isValidId,
  upload.array("images", 5),
  ctrlWrapper(updateParentController),
);
