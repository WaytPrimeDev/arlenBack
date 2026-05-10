import {
  createFamilyController,
  deleteFamilyController,
  getFamilyController,
  reorderFamiliesController,
  updateFamilyController,
} from "../controllers/familyControllers";
import { Router } from "express";
import { auth } from "../middlewares/auth";
import { isValidId } from "../middlewares/isValidId";
import { ctrlWrapper } from "../utils/ctrlWrapper";

export const familyRouter = Router();

familyRouter.post("/", auth, ctrlWrapper(createFamilyController));

familyRouter.get("/", ctrlWrapper(getFamilyController));

familyRouter.delete(
  "/:id",
  auth,
  isValidId,
  ctrlWrapper(deleteFamilyController),
);

familyRouter.patch("/reorder", auth, ctrlWrapper(reorderFamiliesController));
familyRouter.patch(
  "/:id",
  auth,
  isValidId,
  ctrlWrapper(updateFamilyController),
);
