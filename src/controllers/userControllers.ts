import {
  logoutServices,
  registrationService,
  signinServices,
} from "../services/userServices";

import { Response, Request } from "express";
import { MONTH } from "../constant";

export const registrationController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = await registrationService(req.body);

  res.json({
    message: "User successfully create",
    data: user,
  });
};

export const signinController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userAgent = req.get("user-agent");
  const ip = req.ip;
  const { login, password } = req.body;

  const session = await signinServices(login, password, userAgent, ip);

  res.cookie("refreshToken", session.refreshToken, {
    expires: new Date(Date.now() + MONTH),
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

  res.cookie("sessionId", session.sessionId, {
    expires: new Date(Date.now() + MONTH),
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

  res.json({
    message: "login success",
    user: session.user,
    accessToken: session.accessToken,
  });
};

export const logoutController = async (req: Request, res: Response) => {
  if (req.cookies.sessionId) {
    await logoutServices(req.cookies.sessionId);
  }

  res.clearCookie("sessionId", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

  res.status(204).send();
};
