import { UserModel } from "db/model/auth/UserModel";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import { UserDataDto, UserResponseDto } from "interface/userTypes";
import { env } from "utils/env";
import { SessionModel } from "db/model/auth/SessionModel";

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

export const signinServices = async (): Promise<void> => {
  const session = SessionModel.create;
};
