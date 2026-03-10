import { Router } from "express";
import { userRouter } from "./user";
import { catRouter } from "./cat";

export const router = Router();

router.use("/auth", userRouter);

router.use("/cats", catRouter);
