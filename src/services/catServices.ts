import { KittenModel } from "../db/model/cats/KittenModel";
import createHttpError from "http-errors";
import { KittenDataDto, ParentDataDto } from "../interface/kittenTypes";
import path from "node:path";
import {
  uploadToCloudinary,
  deleteMultipleFromCloudinary,
} from "../utils/uploadToCloudinary";
import fs from "fs/promises";
import { ParentModel } from "../db/model/cats/ParentModel";

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
    // ВАЖНО: Если БД упала (например, ошибка уникальности), картинки уже в Cloudinary.
    // В идеальном мире здесь нужно вызвать сервис удаления картинок из Cloudinary по их URL/Public ID,
    // чтобы не плодить мусор на сервере.
    console.error(
      "Database save failed. Orphaned images might exist in Cloudinary",
      error,
    );

    throw createHttpError(500, "Failed to save parent data to the database");
  }
};

//<------------------------------------------------------------------------------------------------------>//

export const getKittenService = async (page: number, perPage: number) => {
  const kittens = await KittenModel.find()
    .skip((page - 1) * perPage)
    .limit(perPage);

  return kittens;
};

export const getKittenByIdService = async (id: string) => {
  const kitten = await KittenModel.findById(id).lean();
  if (!kitten) {
    throw createHttpError(404, "Kitten not found");
  }
  return kitten;
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

  // 3. Удаляем изображения из Cloudinary параллельно
  if (imageUrls.length > 0) {
    await deleteMultipleFromCloudinary(imageUrls);
  }

  // 4. Удаляем документ родителя из БД
  await ParentModel.findByIdAndDelete(parentId);

  return { message: "Parent successfully deleted" };
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

  // 3. Удаляем изображения из Cloudinary параллельно
  if (imageUrls.length > 0) {
    await deleteMultipleFromCloudinary(imageUrls);
  }

  // 4. Если у котенка есть родители, удаляем ID котенка из массива Kittens родителя
  // Используем $pull оператор для удаления ID из массива
  if (kitten.parentId?.mom) {
    await ParentModel.updateOne(
      { _id: kitten.parentId.mom },
      { $pull: { Kittens: kittenId } },
    );
  }

  if (kitten.parentId?.dad) {
    await ParentModel.updateOne(
      { _id: kitten.parentId.dad },
      { $pull: { Kittens: kittenId } },
    );
  }

  // 5. Удаляем документ котенка из БД
  await KittenModel.findByIdAndDelete(kittenId);

  return { message: "Kitten successfully deleted" };
};

//<------------------------------------------------------------------------------------------------------>//
// ОБНОВЛЕНИЕ КОТЕНКА (Kitten) - Частичное обновление с логикой фотографий
//<------------------------------------------------------------------------------------------------------>//

interface UpdateKittenData {
  nameUa?: string;
  nameEn?: string;
  color?: string;
  birthDay?: Date;
  status?: string;
  breed?: string;
  sex?: string;
  price?: {
    breeding?: string;
    pet?: string;
  };
  parentId?: {
    mom?: string | null;
    dad?: string | null;
  };
  retainedImages?: string | string[]; // URL или ID фото, которые нужно оставить
}

export const updateKittenService = async (
  kittenId: string,
  data: UpdateKittenData,
  newPhotos: Express.Multer.File[] = [],
): Promise<any> => {
  // 1. Проверяем, существует ли котенок в БД
  const kitten = await KittenModel.findById(kittenId);
  if (!kitten) {
    throw createHttpError(404, "Kitten not found");
  }

  // 2. Парсим retainedImages (может быть строка, массив строк или пустой)
  let retainedImageUrls: string[] = [];
  if (data.retainedImages) {
    if (typeof data.retainedImages === "string") {
      retainedImageUrls = [data.retainedImages];
    } else if (Array.isArray(data.retainedImages)) {
      retainedImageUrls = data.retainedImages;
    }
  }

  // 3. Вычисляем, какие старые фото нужно удалить из Cloudinary
  // (те, которых нет в retainedImages)
  const currentImageUrls = kitten.images?.map((img) => img.full) || [];
  const imagesToDelete = currentImageUrls.filter(
    (url) => !retainedImageUrls.includes(url),
  );

  // 4. Удаляем старые фото из Cloudinary
  if (imagesToDelete.length > 0) {
    await deleteMultipleFromCloudinary(imagesToDelete);
  }

  // 5. Загружаем новые фото, если они есть
  let newUploadedImages: any[] = [];
  if (newPhotos.length > 0) {
    const uploadPromises = newPhotos.map(async (file) => {
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
          isMain: false, // Новые фото не помечаем как главное
        };
      } catch (err) {
        throw createHttpError(
          500,
          `Failed to upload photo: ${file.originalname}`,
        );
      }
    });

    try {
      newUploadedImages = await Promise.all(uploadPromises);
    } finally {
      // Гарантированно удаляем локальные файлы
      await Promise.allSettled(
        newPhotos.map((file) =>
          fs
            .unlink(file.path)
            .catch((err) =>
              console.warn(`Cleanup failed for ${file.path}:`, err),
            ),
        ),
      );
    }
  }

  // 6. Собираем итоговый массив фото:
  // - Оставляем старые фото, которые были в retainedImages
  // - Добавляем новые загруженные фото
  const retainedOldImages =
    kitten.images?.filter((img) => retainedImageUrls.includes(img.full)) || [];
  const finalImages = [...retainedOldImages, ...newUploadedImages];

  // Убедимся, что у нас есть хотя бы одно фото
  if (finalImages.length === 0) {
    throw createHttpError(400, "At least 1 image is required");
  }
  if (finalImages.length > 5) {
    throw createHttpError(400, "Maximum 5 photos allowed");
  }

  // 7. Собираем обновляемые данные (обновляем только переданные поля)
  const updateData: any = {};

  if (data.nameUa) updateData.nameUa = data.nameUa;
  if (data.nameEn) updateData.nameEn = data.nameEn;
  if (data.color) updateData.color = data.color;
  if (data.birthDay) updateData.birthDay = data.birthDay;
  if (data.status) updateData.status = data.status;
  if (data.breed) updateData.breed = data.breed;
  if (data.sex) updateData.sex = data.sex;

  // Обновляем цены только если переданы
  if (data.price) {
    updateData.price = {
      breeding:
        data.price.breeding !== undefined
          ? data.price.breeding
          : kitten.price?.breeding,
      pet: data.price.pet !== undefined ? data.price.pet : kitten.price?.pet,
    };
  }

  // Обновляем родителей только если переданы
  if (data.parentId) {
    updateData.parentId = {
      mom:
        data.parentId.mom !== undefined
          ? data.parentId.mom
          : kitten.parentId?.mom,
      dad:
        data.parentId.dad !== undefined
          ? data.parentId.dad
          : kitten.parentId?.dad,
    };
  }

  // Всегда обновляем массив фото
  updateData.images = finalImages;

  // 8. Обновляем документ котенка в БД
  const updatedKitten = await KittenModel.findByIdAndUpdate(
    kittenId,
    updateData,
    { new: true },
  );

  return updatedKitten?.toObject();
};

//<------------------------------------------------------------------------------------------------------>//
// ОБНОВЛЕНИЕ РОДИТЕЛЯ (Parent) - Частичное обновление с логикой фотографий
//<------------------------------------------------------------------------------------------------------>//

interface UpdateParentData {
  nameUa?: string;
  nameEn?: string;
  color?: string;
  breed?: string;
  sex?: string;
  retainedImages?: string | string[]; // URL или ID фото, которые нужно оставить
}

export const updateParentService = async (
  parentId: string,
  data: UpdateParentData,
  newPhotos: Express.Multer.File[] = [],
): Promise<any> => {
  // 1. Проверяем, существует ли родитель в БД
  const parent = await ParentModel.findById(parentId);
  if (!parent) {
    throw createHttpError(404, "Parent not found");
  }

  // 2. Парсим retainedImages
  let retainedImageUrls: string[] = [];
  if (data.retainedImages) {
    if (typeof data.retainedImages === "string") {
      retainedImageUrls = [data.retainedImages];
    } else if (Array.isArray(data.retainedImages)) {
      retainedImageUrls = data.retainedImages;
    }
  }

  // 3. Вычисляем, какие старые фото удалить
  const currentImageUrls = parent.images?.map((img) => img.full) || [];
  const imagesToDelete = currentImageUrls.filter(
    (url) => !retainedImageUrls.includes(url),
  );

  // 4. Удаляем старые фото из Cloudinary
  if (imagesToDelete.length > 0) {
    await deleteMultipleFromCloudinary(imagesToDelete);
  }

  // 5. Загружаем новые фото
  let newUploadedImages: any[] = [];
  if (newPhotos.length > 0) {
    const uploadPromises = newPhotos.map(async (file) => {
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
          isMain: false,
        };
      } catch (err) {
        throw createHttpError(
          500,
          `Failed to upload photo: ${file.originalname}`,
        );
      }
    });

    try {
      newUploadedImages = await Promise.all(uploadPromises);
    } finally {
      await Promise.allSettled(
        newPhotos.map((file) =>
          fs
            .unlink(file.path)
            .catch((err) =>
              console.warn(`Cleanup failed for ${file.path}:`, err),
            ),
        ),
      );
    }
  }

  // 6. Собираем финальный массив фото
  const retainedOldImages =
    parent.images?.filter((img) => retainedImageUrls.includes(img.full)) || [];
  const finalImages = [...retainedOldImages, ...newUploadedImages];

  if (finalImages.length === 0) {
    throw createHttpError(400, "At least 1 image is required");
  }
  if (finalImages.length > 5) {
    throw createHttpError(400, "Maximum 5 photos allowed");
  }

  // 7. Собираем обновляемые данные
  const updateData: any = {};

  if (data.nameUa) updateData.nameUa = data.nameUa;
  if (data.nameEn) updateData.nameEn = data.nameEn;
  if (data.color) updateData.color = data.color;
  if (data.breed) updateData.breed = data.breed;
  if (data.sex) updateData.sex = data.sex;

  updateData.images = finalImages;

  // 8. Обновляем документ родителя в БД
  const updatedParent = await ParentModel.findByIdAndUpdate(
    parentId,
    updateData,
    {
      new: true,
    },
  );

  return updatedParent?.toObject();
};
