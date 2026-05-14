import { Router } from "express";
import { userRouter } from "./user";
import { catRouter } from "./cat";
import { familyRouter } from "./family";
import { filterRoute } from "./filters";
import { tgRoute } from "./tgbot";

export const router = Router();

router.use("/auth", userRouter);

router.use("/cats", catRouter);
router.use("/families", familyRouter);

router.use("/filters", filterRoute);

router.use("/tgbot", tgRoute);
