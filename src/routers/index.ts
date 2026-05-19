import { Router } from "express";
import { userRouter } from "./user";
import { catRouter } from "./cat";
import { familyRouter } from "./family";
import { filterRoute } from "./filters";
import { tgRoute } from "./tgbot";
import { familyClientRoutes } from "./clientRoutes/familyRoutes";
import { filterClientRoutes } from "./clientRoutes/filterRoutes";
import { catsClientRoutes } from "./clientRoutes/catsRoutes";

export const router = Router();

router.use("/auth", userRouter);

router.use("/cats", catRouter);
router.use("/families", familyRouter);

router.use("/filters", filterRoute);

router.use("/tgbot", tgRoute);

router.use("/api/families", familyClientRoutes);
router.use("/api/filters", filterClientRoutes);
router.use("/api/cats", catsClientRoutes);
