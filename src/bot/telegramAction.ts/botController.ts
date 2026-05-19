import { UserModel } from "../../db/model/auth/UserModel";

export const getUserInfo = async (login: string) => {
  const user = await UserModel.findOne({ login });
  if (!user) return `Пользователь с логином "${login}" не найден`;

  return `Информация о пользователе:`;
};
