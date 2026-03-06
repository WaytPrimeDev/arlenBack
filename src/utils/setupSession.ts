import crypto from "node:crypto";
import { MONTH } from "constant";
import { ISessionSetup } from "interface/userTypes";

export const setupSession = (): ISessionSetup => {
  const refreshToken = crypto.randomBytes(64).toString("hex");

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  return {
    refreshToken,
    refreshTokenHash,
    refreshTokenValidUntil: new Date(Date.now() + MONTH),
  };
};
