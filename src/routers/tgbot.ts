import { publishKittenToTelegram } from "@/controllers/telegramController";
import { auth } from "../middlewares/auth";
import { ctrlWrapper } from "../utils/ctrlWrapper";
import { Router } from "express";

export const tgRoute = Router();

tgRoute.post("/:id", auth, ctrlWrapper(publishKittenToTelegram));
