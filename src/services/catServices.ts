import createHttpError from "http-errors";
import path from "node:path";
import fs from "fs/promises";
import mongoose from "mongoose";

import {
  uploadToCloudinary,
  deleteMultipleFromCloudinary,
} from "../utils/uploadToCloudinary";
import { KittenDataDto, ParentDataDto } from "../interface/kittenTypes";
import { KittenModel } from "../db/model/cats/KittenModel";
import { ParentModel } from "../db/model/cats/ParentModel";
import { FamilyModel } from "../db/model/family/FamilyModel";
import { applyImageChanges, removeTempFiles } from "../utils/images";
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
  if (!photos || photos.length === 0) {
    throw createHttpError(400, "At least 1 image is required");
  }
  if (photos.length > 5) {
    throw createHttpError(400, "Max 5 images allowed");
  }

  // 2. Формируем промисы для загрузки в Cloudinary
  const uploadPromises = photos.map(async (file, index) => {
    const uniqueName = path.parse(file.filename).name;

    try {
      const url = await uploadToCloudinary(
        file.path,
        "cats/parents",
        uniqueName,
      );

      const getTransformedUrl = (params: string) =>
        url.replace("/upload/", `/upload/${params}/`);

      return {
        full: url,
        thumbnail: getTransformedUrl("w_200,h_200,c_fill"),
        mobile: getTransformedUrl("w_400,h_400,c_fill"),
        isMain: index === 0,
        // localPath: file.path,
      };
    } catch (err) {
      throw createHttpError(
        500,
        `Failed to upload photo to Cloudinary: ${file.originalname}`,
      );
    }
  });

  let uploadedImages;

  // 3. Загружаем в Cloudinary и ГАРАНТИРОВАННО удаляем локальные файлы
  try {
    uploadedImages = await Promise.all(uploadPromises);
  } finally {
    // Promise.allSettled гарантирует, что мы попытаемся удалить все файлы,
    // даже если один из них вызовет ошибку.
    await Promise.allSettled(
      photos.map((file) =>
        fs
          .unlink(file.path)
          .catch((err) =>
            console.warn(`Cleanup failed for ${file.path}:`, err),
          ),
      ),
    );
  }

  // 4. Сохраняем данные в БД
  try {
    const parent = await ParentModel.create({
      ...data,
      images: uploadedImages,
    });

    return {
      ...parent.toObject(),
    };
  } catch (error) {
    console.error(
      "Database save failed. Orphaned images might exist in Cloudinary",
      error,
    );

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
  const uploadPromises = photos.map(async (file, index) => {
    const uniqueName = path.parse(file.filename).name;

    try {
      const url = await uploadToCloudinary(
        file.path,
        "cats/kittens",
        uniqueName,
      );

      const getTransformedUrl = (params: string) =>
        url.replace("/upload/", `/upload/${params}/`);

      return {
        full: url,
        thumbnail: getTransformedUrl("w_200,h_200,c_fill"),
        mobile: getTransformedUrl("w_400,h_400,c_fill"),
        isMain: index === 0,
        localPath: file.path,
      };
    } catch (err) {
      throw createHttpError(
        500,
        `Failed to upload photo: ${file.originalname}`,
      );
    }
  });

  try {
    const uploadedImages = await Promise.all(uploadPromises);

    const kitten = await KittenModel.create({
      ...data,
      images: uploadedImages.map(({ localPath, ...img }) => img),
    });

    return {
      ...kitten.toObject(),
      parentId: {
        mom: kitten.parentId?.mom?.toString() || null,
        dad: kitten.parentId?.dad?.toString() || null,
      },
    };
  } finally {
    for (const file of photos) {
      fs.unlink(file.path).catch((err) =>
        console.warn(`Cleanup failed for ${file.path}:`, err),
      );
    }
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

    const { retainedImages, breeding, pet, ...fields } = input;

    await applyImageChanges({
      currentImages: kitten.images,
      retainedUrls: retainedImages ?? kitten.images.map((image) => image.full),
      newFiles: newPhotos,
      folder: "cats/kittens",
      persist: async (images) => {
        kitten.set({ ...fields, images });
        // точечно, чтобы не затереть вторую цену
        if (breeding !== undefined) kitten.set("price.breeding", breeding);
        if (pet !== undefined) kitten.set("price.pet", pet);
        await kitten.save(); // валидаторы схемы (enum'ы, 1..5 фото) срабатывают здесь
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

    const { retainedImages, ...fields } = input;

    await applyImageChanges({
      currentImages: parent.images,
      retainedUrls: retainedImages ?? parent.images.map((image) => image.full),
      newFiles: newPhotos,
      folder: "cats/parents",
      persist: async (images) => {
        parent.set({ ...fields, images });
        await parent.save(); // валидаторы схемы (enum sex, 1..5 фото) срабатывают здесь
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
