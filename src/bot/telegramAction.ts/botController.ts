import { UserModel } from "db/model/auth/UserModel";

export const getUserInfo = async (login: string) => {
  const user = await UserModel.findOne({ login });
  if (!user) return `Пользователь с логином "${login}" не найден`;

  return `info about user ${user._id}- id ${user.login}- login  ${user.email}- email`;
};
