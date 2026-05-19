import { Router } from "express";
import { ctrlWrapper } from "../../utils/ctrlWrapper";
import { getFamiliesClientController } from "../../controllers/clientController/familyClientController";

export const familyClientRoutes = Router();

familyClientRoutes.get("/", ctrlWrapper(getFamiliesClientController));
