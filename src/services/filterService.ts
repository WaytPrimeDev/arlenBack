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
  const color = await ColorModel.findById(id);

  if (!color) {
    throw createHttpError(404, "Color not found");
  }

  const kittenWithColor = await KittenModel.exists({ color: color.name });

  if (kittenWithColor) {
    throw createHttpError(
      409,
      "Cannot delete color: there are kittens associated with it",
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

  if (!breed) {
    throw createHttpError(404, "Breed not found");
  }

  const hasKittens = await KittenModel.exists({ breed: breed.name });

  if (hasKittens) {
    throw createHttpError(
      409,
      "Cannot delete breed: there are kittens associated with it",
    );
  }

  await BreedModel.findByIdAndDelete(id);
  return;
};
