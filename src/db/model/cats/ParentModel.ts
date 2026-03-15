import { Sex } from "interface/kittenTypes";
import { model, Schema } from "mongoose";

const ParentSchema = new Schema({
  name: { type: String, required: true },
  color: { type: String, required: true },
  title: { type: String, required: true },
  sex: { type: String, enum: Object.values(Sex), required: true },
  Kittens: [{ type: Schema.Types.ObjectId, ref: "Kitten" }],
});

export const ParentModel = model("Parent", ParentSchema);
