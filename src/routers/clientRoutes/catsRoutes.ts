import { Router } from "express";
import { ctrlWrapper } from "../../utils/ctrlWrapper";
import {
  getKittenByIdClientController,
  getKittensClientController,
  getParentByIdClientController,
  getParentsClientController,
} from "../../controllers/clientController/catsClientController";
import { isValidId } from "../../middlewares/isValidId";

export const catsClientRoutes = Router();

catsClientRoutes.get("/kittens", ctrlWrapper(getKittensClientController));
catsClientRoutes.get("/parents", ctrlWrapper(getParentsClientController));

catsClientRoutes.get(
  "/kitten/:id",
  isValidId,
  ctrlWrapper(getKittenByIdClientController),
);
catsClientRoutes.get(
  "/parent/:id",
  isValidId,
  ctrlWrapper(getParentByIdClientController),
);
