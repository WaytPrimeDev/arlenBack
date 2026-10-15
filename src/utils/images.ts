import createHttpError from "http-errors";
import path from "node:path";
import fs from "node:fs/promises";

import {
  uploadToCloudinary,
  deleteMultipleFromCloudinary,
} from "./uploadToCloudinary";

export const MIN_IMAGES = 1;
export const MAX_IMAGES = 5;

export interface StoredImage {
  full: string;
  thumbnail: string;
  mobile: string;
  isMain: boolean;
}

// Mongoose-сабдокументы тоже подходят: нужны только URL-поля
type ExistingImage = Pick<StoredImage, "full" | "thumbnail" | "mobile">;

export interface ImageSyncResult {
  images: StoredImage[];
  removedUrls: string[];
}

const withTransformation = (url: string, params: string) =>
  url.replace("/upload/", `/upload/${params}/`);

const toStoredImage = (url: string): StoredImage => ({
  full: url,
  thumbnail: withTransformation(url, "w_200,h_200,c_fill"),
  mobile: withTransformation(url, "w_400,h_400,c_fill"),
  isMain: false, // главное фото назначает syncImages
});

export const assertImageCount = (count: number) => {
  if (count < MIN_IMAGES) {
    throw createHttpError(400, `At least ${MIN_IMAGES} image is required`);
  }
  if (count > MAX_IMAGES) {
    throw createHttpError(400, `Maximum ${MAX_IMAGES} photos allowed`);
  }
};

export const removeTempFiles = async (files: Express.Multer.File[]) => {
  const results = await Promise.allSettled(
    files.map((file) => fs.unlink(file.path)),
  );
  results.forEach((result, index) => {
    if (
      result.status === "rejected" &&
      (result.reason as NodeJS.ErrnoException).code !== "ENOENT"
    ) {
      console.warn(`Cleanup failed for ${files[index].path}:`, result.reason);
    }
  });
};

/**
 * Загружает файлы в Cloudinary параллельно.
 * Всё или ничего: если хоть один файл не загрузился, уже загруженные
 * удаляются, чтобы в Cloudinary не оставались сироты.
 * Временные файлы не трогает — их удаляет владелец запроса (сервис).
 */
export const uploadImages = async (
  files: Express.Multer.File[],
  folder: string,
): Promise<StoredImage[]> => {
  if (files.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    files.map((file) =>
      uploadToCloudinary(file.path, folder, path.parse(file.filename).name),
    ),
  );

  const uploadedUrls = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  const failedIndex = results.findIndex(
    (result) => result.status === "rejected",
  );
  if (failedIndex !== -1) {
    const failure = results[failedIndex] as PromiseRejectedResult;
    console.error("Cloudinary upload failed:", failure.reason);
    await deleteMultipleFromCloudinary(uploadedUrls);
    throw createHttpError(
      502,
      `Failed to upload photo: ${files[failedIndex].originalname}`,
    );
  }

  return uploadedUrls.map(toStoredImage);
};

/**
 * Чистая функция: собирает итоговый массив фото.
 * - порядок задаёт клиент: сначала retainedUrls в его порядке, потом новые;
 * - главное фото — первое в итоговом массиве;
 * - URL, которых нет у записи, — ошибка клиента (400), а не молчаливый пропуск.
 */
export const syncImages = (
  currentImages: readonly ExistingImage[],
  retainedUrls: readonly string[],
  uploadedImages: readonly StoredImage[],
): ImageSyncResult => {
  const currentByUrl = new Map(
    currentImages.map((image) => [image.full, image]),
  );
  const uniqueRetainedUrls = [...new Set(retainedUrls)];

  const unknownUrls = uniqueRetainedUrls.filter((url) => !currentByUrl.has(url));
  if (unknownUrls.length > 0) {
    throw createHttpError(
      400,
      `Retained images do not belong to this record: ${unknownUrls.join(", ")}`,
    );
  }

  const ordered: ExistingImage[] = [
    ...uniqueRetainedUrls.map((url) => currentByUrl.get(url)!),
    ...uploadedImages,
  ];
  assertImageCount(ordered.length);

  // Явная сборка объекта: spread mongoose-сабдокумента тащит служебные поля
  const images = ordered.map(
    (image, index): StoredImage => ({
      full: image.full,
      thumbnail: image.thumbnail,
      mobile: image.mobile,
      isMain: index === 0,
    }),
  );

  const retainedSet = new Set(uniqueRetainedUrls);
  const removedUrls = currentImages
    .filter((image) => !retainedSet.has(image.full))
    .map((image) => image.full);

  return { images, removedUrls };
};

/**
 * Безопасный порядок side effects:
 * проверка → загрузка новых → запись в БД (при ошибке откат загруженных)
 * → удаление старых из Cloudinary только после успешной записи.
 */
export const applyImageChanges = async (options: {
  currentImages: readonly ExistingImage[];
  retainedUrls: readonly string[];
  newFiles: Express.Multer.File[];
  folder: string;
  persist: (images: StoredImage[]) => Promise<void>;
}) => {
  const { currentImages, retainedUrls, newFiles, folder, persist } = options;

  // Дешёвая предпроверка, чтобы не грузить файлы зря
  assertImageCount(new Set(retainedUrls).size + newFiles.length);

  const uploadedImages = await uploadImages(newFiles, folder);

  let removedUrls: string[];
  try {
    const result = syncImages(currentImages, retainedUrls, uploadedImages);
    await persist(result.images);
    removedUrls = result.removedUrls;
  } catch (error) {
    await deleteMultipleFromCloudinary(
      uploadedImages.map((image) => image.full),
    );
    throw error;
  }

  await deleteMultipleFromCloudinary(removedUrls);
};
