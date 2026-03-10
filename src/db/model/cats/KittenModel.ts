import { KittenStatus } from "interface/kittenTypes";
import { model, Schema } from "mongoose";

const imageSchema = new Schema(
  {
    full: { type: String, required: true },
    thumbnail: { type: String, required: true },
    mobile: { type: String, required: true },
    isMain: { type: Boolean, default: false },
  },
  { _id: false },
);

const kittenSchema = new Schema(
  {
    name: { type: String, required: true },
    color: { type: String, required: true },
    birthDay: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(KittenStatus),
      default: KittenStatus.ACTIVE,
    },
    images: {
      type: [imageSchema],
      validate: [
        {
          validator: (arr: any[]) => arr.length >= 1,
          message: "At least 1 image is required",
        },
        {
          validator: (arr: any[]) => arr.length <= 5,
          message: "Max 5 images allowed",
        },
      ],
    },
  },
  { versionKey: false, timestamps: true },
);

export const KittenModel = model("Kitten", kittenSchema);
