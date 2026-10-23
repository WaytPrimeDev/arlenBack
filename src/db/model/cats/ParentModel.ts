import { Sex } from "../../../interface/kittenTypes";
import { model, Schema } from "mongoose";
import { MAX_IMAGES, MIN_IMAGES } from "../../../utils/images";

const imageSchema = new Schema(
  {
    full: { type: String, required: true },
    thumbnail: { type: String, required: true },
    mobile: { type: String, required: true },
    isMain: { type: Boolean, default: false },
  },
  { _id: false },
);

const ParentSchema = new Schema(
  {
    nameUa: { type: String, required: true },
    nameEn: { type: String, required: true },
    color: { type: String, required: true },
    familyId: [{ type: Schema.Types.ObjectId, ref: "Family", default: null }],
    // title: { type: String, required: true },
    breed: { type: String, required: true },
    // userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sex: { type: String, enum: Object.values(Sex), required: true },
    Kittens: [{ type: Schema.Types.ObjectId, ref: "Kitten", default: null }],
    images: {
      type: [imageSchema],
      validate: [
        {
          validator: (arr: any[]) => arr.length >= MIN_IMAGES,
          message: `At least ${MIN_IMAGES} image is required`,
        },
        {
          validator: (arr: any[]) => arr.length <= MAX_IMAGES,
          message: `Max ${MAX_IMAGES} images allowed`,
        },
      ],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const ParentModel = model("Parent", ParentSchema);
