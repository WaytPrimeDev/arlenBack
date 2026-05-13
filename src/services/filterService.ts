import { KittenModel } from "../db/model/cats/KittenModel";
import { BreedModel } from "../db/model/filters/BreedModel";
import { ColorModel } from "../db/model/filters/ColorModel";
import createHttpError from "http-errors";

export const getColorService = async () => {
  const color = await ColorModel.find();
  return color;
};

export const createColorService = async (name: { name: string }) => {
  const color = await ColorModel.create(name);
  return color;
};

export const deleteColorService = async (id: string) => {
  const color = await BreedModel.findById(id);

  // 2. Проверяем, найден ли документ
  if (!color) {
    throw createHttpError(404, "Breed not found");
  }

  // 3. Теперь breed.name доступен (TS не будет ругаться)
  const kittenWithColor = await KittenModel.findOne({ breed: color.name });

  if (kittenWithColor) {
    throw createHttpError(
      400,
      "Kitten with this color was found, cannot delete",
    );
  }
  await ColorModel.findByIdAndDelete(id);
  return;
};

export const getBreedService = async () => {
  const breed = await BreedModel.find();
  return breed;
};

export const createBreedService = async (name: { name: string }) => {
  const breed = await BreedModel.create(name);
  return breed;
};

export const deleteBreedService = async (id: string) => {
  const breed = await BreedModel.findById(id);

  // 2. Проверяем, найден ли документ
  if (!breed) {
    throw createHttpError(404, "Breed not found");
  }

  // 3. Теперь breed.name доступен (TS не будет ругаться)
  const kittenWithBreed = await KittenModel.findOne({ breed: breed.name });

  if (kittenWithBreed) {
    throw createHttpError(
      400,
      "Kitten with this breed was found, cannot delete",
    );
  }

  await BreedModel.findByIdAndDelete(id);
  return;
};
