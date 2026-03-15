import createHttpError from "http-errors";
import jwt from "jsonwebtoken";

import { env } from "./env";

export const verifyAccessToken = (token: string) => {
  try {
    const decodedToken = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      sid: string;
    };

    return decodedToken;
  } catch {
    throw createHttpError(401, "Invalid access token");
  }
};
