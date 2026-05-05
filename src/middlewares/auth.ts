import createHttpError from "http-errors";
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/verifyAccessToken";
import { SessionModel } from "../db/model/auth/SessionModel";
import { UserModel } from "../db/model/auth/UserModel";

export const auth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    throw createHttpError(401, "Please provide Authorization header");
  }

  const [bearer, token] = authHeader.split(" ");
  if (bearer !== "Bearer" || !token) {
    throw createHttpError(401, "Auth header should be of type Bearer");
  }
  const { sid, sub } = verifyAccessToken(token);

  const sessionId = await SessionModel.findOne({
    _id: sid,
    userId: sub,
  });
  if (!sessionId) {
    throw createHttpError(401, "Invalid session");
  }
  const user = await UserModel.findById(sub);
  if (!user) {
    throw createHttpError(401, "User not found");
  }
  req.user = {
    id: user._id.toString(),
    email: user.email,
    role: user.type,
  };
  next();
};
