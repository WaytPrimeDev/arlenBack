import createHttpError from "http-errors";
import mongoose from "mongoose";

import { deleteMultipleFromCloudinary } from "../utils/uploadToCloudinary";
import { KittenDataDto, ParentDataDto } from "../interface/kittenTypes";
import { KittenModel } from "../db/model/cats/KittenModel";
import { ParentModel } from "../db/model/cats/ParentModel";
import { FamilyModel } from "../db/model/family/FamilyModel";
import {
  applyImageChanges,
  assertImageCount,
  removeTempFiles,
  uploadImages,
  StoredImage,
} from "../utils/images";
import {
  UpdateKittenInput,
  UpdateParentInput,
} from "../validation/catSchemas";

export const getParentService = async () => {
  const parents = await ParentModel.find();
  return parents;
};

export const addParentKittenService = async (
  data: ParentDataDto,
  photos: Express.Multer.File[],
) => {
  // 1. Ранняя валидация файлов до начала загрузки
  assertImageCount(photos?.length ?? 0);

  let uploadedImages: StoredImage[];

  // 2. Сжимаем, загружаем в Cloudinary и ГАРАНТИРОВАННО удаляем локальные файлы.
  //    uploadImages работает по принципу "всё или ничего": при сбое на любом
  //    файле уже загруженные удаляются сами.
  try {
    uploadedImages = await uploadImages(photos, "cats/parents");
  } finally {
    await removeTempFiles(photos);
  }

  // 3. Главное фото — первое в присланном порядке
  const images = uploadedImages.map((image, index) => ({
    ...image,
    isMain: index === 0,
  }));

  // 4. Сохраняем данные в БД
  try {
    const parent = await ParentModel.create({
      ...data,
      images,
    });

    return {
      ...parent.toObject(),
    };
  } catch (error) {
    // Запись не удалась — убираем уже загруженные фото,
    // иначе в Cloudinary останутся сироты
    console.error("Database save failed, rolling back uploads", error);
    await deleteMultipleFromCloudinary(images.map((image) => image.full));

    throw createHttpError(500, "Failed to save parent data to the database");
  }
};

//<------------------------------------------------------------------------------------------------------>//

export const getKittensService = async (page: number, perPage: number) => {
  const skipCount = (page - 1) * perPage;

  const kittens = await KittenModel.aggregate([
    // 1. ПАГИНАЦИЯ (Обязательно первыми шагами для скорости!)
    // База берет только нужные 20 документов текущей страницы
    { $skip: skipCount },
    { $limit: perPage },

    // 2. JOIN: Подтягиваем данные из таблицы постов
    {
      $lookup: {
        from: "telegramposts", // Название коллекции в MongoDB (обычно маленькими буквами с 's' на конце)
        localField: "_id", // ID в текущей модели Kitten
        foreignField: "kittenId", // Поле связи в TelegramPost
        as: "telegramData",
      },
    },

    // 3. ДОБАВЛЯЕМ ФЛАГ: Если массив telegramData не пустой, значит пост есть
    {
      $addFields: {
        isTelegramPublished: { $gt: [{ $size: "$telegramData" }, 0] },
      },
    },

    // 4. ОЧИСТКА: Убираем служебный массив, чтобы не тащить его на фронтенд
    {
      $project: {
        telegramData: 0,
      },
    },
  ]);

  return kittens;
};

export const getKittenByIdService = async (id: string) => {
  const kitten = await KittenModel.findById(id).lean();
  if (!kitten) {
    throw createHttpError(404, "Kitten not found");
  }
  return kitten;
};

export const getParentByIdService = async (id: string) => {
  const parent = await ParentModel.findById(id).lean();
  if (!parent) {
    throw createHttpError(404, "Parent not found");
  }
  return parent;
};

export const addKittenService = async (
  data: KittenDataDto,
  photos: Express.Multer.File[],
): Promise<KittenDataDto> => {
  assertImageCount(photos?.length ?? 0);

  let uploadedImages: StoredImage[];

  try {
    uploadedImages = await uploadImages(photos, "cats/kittens");
  } finally {
    await removeTempFiles(photos);
  }

  // Главное фото — первое в присланном порядке
  const images = uploadedImages.map((image, index) => ({
    ...image,
    isMain: index === 0,
  }));

  try {
    const kitten = await KittenModel.create({
      ...data,
      images,
    });

    return {
      ...kitten.toObject(),
      parentId: {
        mom: kitten.parentId?.mom?.toString() || null,
        dad: kitten.parentId?.dad?.toString() || null,
      },
    };
  } catch (error) {
    console.error("Database save failed, rolling back uploads", error);
    await deleteMultipleFromCloudinary(images.map((image) => image.full));

    throw error;
  }
};

//<------------------------------------------------------------------------------------------------------>//
// УДАЛЕНИЕ РОДИТЕЛЯ (Parent)
//<------------------------------------------------------------------------------------------------------>//

export const deleteParentService = async (parentId: string) => {
  // 1. Проверяем, существует ли родитель в БД
  const parent = await ParentModel.findById(parentId);
  if (!parent) {
    throw createHttpError(404, "Parent not found");
  }

  // 2. Извлекаем все URL изображений родителя
  const imageUrls = parent.images?.map((img) => img.full) || [];

  // 3. Удаляем изображения из Cloudinary
  if (imageUrls.length > 0) {
    await deleteMultipleFromCloudinary(imageUrls);
  }

  // 4. Отвязываем родителя от КОТЯТ (в KittenModel.parentId)
  await KittenModel.updateMany(
    { "parentId.mom": parentId },
    { $set: { "parentId.mom": null } },
  );
  await KittenModel.updateMany(
    { "parentId.dad": parentId },
    { $set: { "parentId.dad": null } },
  );

  // 5. Отвязываем родителя от СЕМЕЙ (в FamilyModel.parents)
  await FamilyModel.updateMany(
    { "parents.mom": parentId },
    { $set: { "parents.mom": null } },
  );
  await FamilyModel.updateMany(
    { "parents.dad": parentId },
    { $set: { "parents.dad": null } },
  );

  // 6. Удаляем сам документ родителя
  await ParentModel.findByIdAndDelete(parentId);

  return {
    message:
      "Parent successfully deleted and unlinked from kittens and families",
  };
};

//<------------------------------------------------------------------------------------------------------>//
// УДАЛЕНИЕ КОТЕНКА (Kitten)
//<------------------------------------------------------------------------------------------------------>//

export const deleteKittenService = async (kittenId: string) => {
  // 1. Проверяем, существует ли котенок в БД
  const kitten = await KittenModel.findById(kittenId);
  if (!kitten) {
    throw createHttpError(404, "Kitten not found");
  }

  // 2. Извлекаем все URL изображений котенка
  const imageUrls = kitten.images?.map((img) => img.full) || [];

  // 3. Удаляем изображения из Cloudinary
  if (imageUrls.length > 0) {
    await deleteMultipleFromCloudinary(imageUrls);
  }

  // 4. Удаляем ID котенка из массива Kittens у всех РОДИТЕЛЕЙ
  // Mongoose сам найдет документы, где в массиве Kittens есть kittenId
  await ParentModel.updateMany(
    { Kittens: kittenId },
    { $pull: { Kittens: kittenId } },
  );

  // 5. Удаляем ID котенка из массива kittens у всех СЕМЕЙ
  await FamilyModel.updateMany(
    { kittens: kittenId },
    { $pull: { kittens: kittenId } },
  );

  // 6. Удаляем сам документ котенка
  await KittenModel.findByIdAndDelete(kittenId);

  return {
    message:
      "Kitten successfully deleted and unlinked from parents and families",
  };
};

//<------------------------------------------------------------------------------------------------------>//
// ОБНОВЛЕНИЕ КОТЕНКА (Kitten) - Частичное обновление с логикой фотографий
//<------------------------------------------------------------------------------------------------------>//

export const updateKittenService = async (
  kittenId: string,
  input: UpdateKittenInput,
  newPhotos: Express.Multer.File[],
) => {
  try {
    const kitten = await KittenModel.findById(kittenId);
    if (!kitten) {
      throw createHttpError(404, "Kitten not found");
    }

    const { retainedImages, imagesOrder, breeding, pet, ...fields } = input;

    await applyImageChanges({
      currentImages: kitten.images,
      retainedUrls: retainedImages ?? kitten.images.map((image) => image.full),
      newFiles: newPhotos,
      folder: "cats/kittens",
      imagesOrder,
      persist: async (images) => {
        kitten.set({ ...fields, images });
        // точечно, чтобы не затереть вторую цену
        if (breeding !== undefined) kitten.set("price.breeding", breeding);
        if (pet !== undefined) kitten.set("price.pet", pet);
        await kitten.save(); // валидаторы схемы (enum'ы, 1..MAX_IMAGES фото) срабатывают здесь
      },
    });

    return kitten.toObject();
  } catch (error) {
    throw toHttpError(error, "Kitten not found");
  } finally {
    await removeTempFiles(newPhotos);
  }
};

//<------------------------------------------------------------------------------------------------------>//
// ОБНОВЛЕНИЕ РОДИТЕЛЯ (Parent) - Частичное обновление с логикой фотографий
//<------------------------------------------------------------------------------------------------------>//

export const updateParentService = async (
  parentId: string,
  input: UpdateParentInput,
  newPhotos: Express.Multer.File[],
) => {
  try {
    const parent = await ParentModel.findById(parentId);
    if (!parent) {
      throw createHttpError(404, "Parent not found");
    }

    const { retainedImages, imagesOrder, ...fields } = input;

    await applyImageChanges({
      currentImages: parent.images,
      retainedUrls: retainedImages ?? parent.images.map((image) => image.full),
      newFiles: newPhotos,
      folder: "cats/parents",
      imagesOrder,
      persist: async (images) => {
        parent.set({ ...fields, images });
        await parent.save(); // валидаторы схемы (enum sex, 1..MAX_IMAGES фото) срабатывают здесь
      },
    });

    return parent.toObject();
  } catch (error) {
    throw toHttpError(error, "Parent not found");
  } finally {
    await removeTempFiles(newPhotos);
  }
};

// Ошибки mongoose не несут HTTP-статуса — без этого errorHandler отдаёт 500
const toHttpError = (error: unknown, notFoundMessage: string) => {
  if (error instanceof mongoose.Error.ValidationError) {
    return createHttpError(400, error.message);
  }
  if (error instanceof mongoose.Error.DocumentNotFoundError) {
    // запись удалили между findById и save
    return createHttpError(404, notFoundMessage);
  }
  return error;
};
