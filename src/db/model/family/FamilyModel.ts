import { model, Schema } from "mongoose";

const parentSubSchema = new Schema(
  {
    mom: {
      type: Schema.Types.ObjectId,
      ref: "Parent",
      default: null,
    },
    dad: {
      type: Schema.Types.ObjectId,
      ref: "Parent",
      default: null,
    },
  },
  { _id: false },
);

const familySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    parents: {
      type: parentSubSchema,
      required: true,
    },
    kittens: [
      {
        type: Schema.Types.ObjectId,
        ref: "Kitten",
      },
    ],
    displayOrder: {
      type: Number,
      default: 0,
      description: "Порядок отображения семьи в UI",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const FamilyModel = model("Family", familySchema);
