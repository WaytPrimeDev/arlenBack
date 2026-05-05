import cloudinary from "cloudinary";
import { env } from "./env";

cloudinary.v2.config({
  secure: true,
  cloud_name: env.API_NAME_CLOUD,
  api_key: env.API_KEY_CLOUD,
  api_secret: env.API_SECRET_CLOUD,
});

export const uploadToCloudinary = async (
  filePath: string,
  folder: string,
  publicId?: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(
      filePath,
      {
        folder: folder,
        public_id: publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error("No result"));
        resolve(result.secure_url);
      },
    );
  });
};

/**
 * Извлекает public_id из полного URL Cloudinary
 * Пример: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/cats/parents/filename.jpg
 * Результат: cats/parents/filename
 */
export const extractPublicIdFromUrl = (fullUrl: string): string => {
  try {
    // Ищем позицию "/upload/" в URL
    const uploadIndex = fullUrl.indexOf("/upload/");
    if (uploadIndex === -1) {
      throw new Error("Invalid Cloudinary URL: missing /upload/");
    }

    // Берем часть после "/upload/"
    const afterUpload = fullUrl.substring(uploadIndex + 8); // "/upload/" = 8 символов

    // Удаляем версию вида /v1234567890/
    const publicIdWithVersion = afterUpload.replace(/^v\d+\//, "");

    // Удаляем расширение файла
    const publicId = publicIdWithVersion.replace(/\.[^/.]+$/, "");

    return publicId;
  } catch (error) {
    console.error("Failed to extract public_id from URL:", fullUrl, error);
    return "";
  }
};

/**
 * Удаляет одно изображение из Cloudinary
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.warn(
          `Failed to delete image ${publicId} from Cloudinary:`,
          error,
        );
        // Не выбрасываем ошибку, просто логируем - процесс удаления не должен прерваться
        resolve();
      } else {
        resolve();
      }
    });
  });
};

/**
 * Удаляет несколько изображений из Cloudinary параллельно
 */
export const deleteMultipleFromCloudinary = async (
  fullUrls: string[],
): Promise<void> => {
  if (!fullUrls || fullUrls.length === 0) {
    return;
  }

  const publicIds = fullUrls.map((url) => extractPublicIdFromUrl(url));
  const deletePromises = publicIds.map((id) => deleteFromCloudinary(id));

  await Promise.all(deletePromises);
};
