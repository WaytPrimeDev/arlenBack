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
