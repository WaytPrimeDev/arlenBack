import { model, Schema } from "mongoose";

const breedSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export const BreedModel = model("Breed", breedSchema);
