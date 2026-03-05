import {
  registrationController,
  signinController,
} from "controllers/userControllers";
import { Router } from "express";
import { ctrlWrapper } from "utils/ctrlWrapper";

export const userRouter = Router();

userRouter.post("/register", ctrlWrapper(registrationController));

userRouter.get("/signin", ctrlWrapper(signinController));
