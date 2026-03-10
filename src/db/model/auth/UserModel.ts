import { UserStatus } from "interface/userTypes";
import mongoose, { InferSchemaType, Schema } from "mongoose";

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
      enum: Object.values(UserStatus),
      default: UserStatus.USER,
    },
  },
  { timestamps: true },
);
export type UserModelType = InferSchemaType<typeof userSchema>;
export const UserModel = mongoose.model("User", userSchema);
