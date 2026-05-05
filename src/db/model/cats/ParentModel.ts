import { Sex } from "interface/kittenTypes";
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

const ParentSchema = new Schema({
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
        validator: (arr: any[]) => arr.length >= 1,
        message: "At least 1 image is required",
      },
      {
        validator: (arr: any[]) => arr.length <= 5,
        message: "Max 5 images allowed",
      },
    ],
  },
});

export const ParentModel = model("Parent", ParentSchema);
