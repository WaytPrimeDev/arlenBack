import { model, Schema } from "mongoose";

const colorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const ColorModel = model("Color", colorSchema);
