import { Sex, KittenStatus } from "../../../interface/kittenTypes";
import { model, Schema } from "mongoose";

const parentSchema = new Schema(
  {
    mom: { type: Schema.Types.ObjectId, ref: "Parent", default: null },
    dad: { type: Schema.Types.ObjectId, ref: "Parent", default: null },
  },
  { _id: false },
);

const imageSchema = new Schema(
  {
    full: { type: String, required: true },
    thumbnail: { type: String, required: true },
    mobile: { type: String, required: true },
    isMain: { type: Boolean, default: false },
  },
  { _id: false },
);
const priceSchema = new Schema(
  {
    breeding: { type: String, default: "null" },
    pet: { type: String, default: "null" },
  },
  { _id: false },
);

const kittenSchema = new Schema(
  {
    nameUa: { type: String, required: true },
    nameEn: { type: String, required: true },
    color: { type: String, required: true },
    birthDay: { type: Date, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(KittenStatus),
      default: KittenStatus.OFFLINE,
    },
    breed: { type: String, required: true },

    parentId: parentSchema,
    sex: { type: String, enum: Object.values(Sex), required: true },

    price: { type: priceSchema, required: true },

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
  {
    versionKey: false,
    timestamps: true,
  },
);

export const KittenModel = model("Kitten", kittenSchema);
