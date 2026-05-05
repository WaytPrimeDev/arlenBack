import { Router } from "express";
import { userRouter } from "./user";
import { catRouter } from "./cat";
import { familyRouter } from "./family";

export const router = Router();

router.use("/auth", userRouter);

router.use("/cats", catRouter);
router.use("/families", familyRouter);
