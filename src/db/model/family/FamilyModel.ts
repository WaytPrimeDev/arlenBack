import { model, Schema } from "mongoose";
const parentSchema = new Schema(
  {
    mom: {
      type: Schema.Types.ObjectId,
      ref: "Parent",
    },
    dad: {
      type: Schema.Types.ObjectId,
      ref: "Parent",
    },
  },
  { _id: false },
);

const familySchema = new Schema({
  name: {
    type: String,
    require: true,
  },
  parent: { type: parentSchema },
  kitten: {
    type: [String],
  },
});

export const FamilyModel = model("Family", familySchema);
