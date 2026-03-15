import { KittenModel } from "db/model/cats/KittenModel";
import createHttpError from "http-errors";
import { KittenDataDto, ParentDataDto } from "interface/kittenTypes";
import path from "node:path";
import { uploadToCloudinary } from "utils/uploadToCloudinary";
import fs from "fs/promises";
import { ParentModel } from "db/model/cats/ParentModel";

export const addParentKittenService = async (data: ParentDataDto) => {
  const parent = await ParentModel.create(data);
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
      userId: kitten.userId.toString(),
      parentId: kitten.parentId?.toString(),
    };
  } finally {
    for (const file of photos) {
      fs.unlink(file.path).catch((err) =>
        console.warn(`Cleanup failed for ${file.path}:`, err),
      );
    }
  }
};
