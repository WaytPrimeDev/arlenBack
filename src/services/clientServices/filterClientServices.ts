import { KittenModel } from "../../db/model/cats/KittenModel";
import createHttpError from "http-errors";

export const getColorsClientService = async () => {
  const colors = await KittenModel.distinct("color", {
    familyId: { $ne: null },
  });

  if (!colors || colors.length === 0) {
    throw createHttpError(404, "No colors found");
  }
  return colors;
};

export const getBreedClientService = async () => {
  const breeds = await KittenModel.distinct("breed", {
    familyId: { $ne: null },
  });

  if (!breeds || breeds.length === 0) {
    throw createHttpError(404, "No breeds found");
  }
  return breeds;
};
