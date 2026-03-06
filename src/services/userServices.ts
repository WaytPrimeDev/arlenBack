import createHttpError from "http-errors";
import bcrypt, { compare } from "bcrypt";
import jwt from "jsonwebtoken";

import { UserModel } from "db/model/auth/UserModel";
import {
  ISigninService,
  UserDataDto,
  UserResponseDto,
} from "interface/userTypes";
import { env } from "utils/env";
import { SessionModel } from "db/model/auth/SessionModel";
import { setupSession } from "utils/setupSession";

export const registrationService = async (
  data: UserDataDto,
): Promise<UserResponseDto> => {
  let user = await UserModel.findOne({ email: data.email });
  if (user)
    throw createHttpError(409, `User with email ${data.email} already exists`);

  const hash = await bcrypt.hash(data.password, Number(env.SALT_ROUNDS));

  try {
    user = await UserModel.create({ ...data, password: hash });
  } catch (error: any) {
    if (error.code === 11000) {
      throw createHttpError(409, "User already exists");
    }

    throw error;
  }

  return {
    email: user.email,
    login: user.login,
    userName: user.userName,
  };
};

export const signinServices = async (
  login: string,
  password: string,
  userAgent: string | undefined,
  ip: string | undefined,
): Promise<ISigninService> => {
  const user = await UserModel.findOne({ login: login });
  if (!user) {
    throw createHttpError(403, "Login or password incorrect");
  }
  const passwordCompare = await compare(password, user.password);
  if (!passwordCompare) {
    throw createHttpError(403, "Login or password incorrect");
  }

  await SessionModel.deleteOne({
    userId: user._id,
    userAgent,
  });

  const sessionConfig = setupSession();
  const session = await SessionModel.create({
    refreshTokenHash: sessionConfig.refreshTokenHash,
    refreshTokenValidUntil: sessionConfig.refreshTokenValidUntil,
    userId: user._id,
    userAgent,
    ip,
  });

  const accessToken = jwt.sign(
    {
      sub: user._id,
      sid: session._id.toString(),
    },
    env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  return {
    accessToken,
    refreshToken: sessionConfig.refreshToken,
    sessionId: session._id.toString(),
  };
};

export const logoutServices = async (_id: string) => {
  await SessionModel.deleteOne({ _id });
};
