import {
  logoutController,
  registrationController,
  signinController,
} from "controllers/userControllers";
import { Router } from "express";
import { ctrlWrapper } from "utils/ctrlWrapper";

export const userRouter = Router();

userRouter.post("/register", ctrlWrapper(registrationController));

userRouter.post("/signin", ctrlWrapper(signinController));

userRouter.post("/logout", ctrlWrapper(logoutController));
