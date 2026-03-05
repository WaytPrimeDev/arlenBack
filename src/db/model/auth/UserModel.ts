import mongoose, { InferSchemaType, Schema } from "mongoose";
import { USER_TYPES } from "../../../constant/index";

const userSchema = new Schema(
  {
    userName: {
      required: true,
      type: String,
    },
    login: {
      index: true,
      unique: true,
      required: true,
      type: String,
    },
    password: {
      required: true,
      type: String,
    },
    email: {
      index: true,
      unique: true,
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: USER_TYPES,
      default: USER_TYPES[0],
    },
  },
  { timestamps: true },
);
export type UserModelType = InferSchemaType<typeof userSchema>;
export const UserModel = mongoose.model("User", userSchema);
