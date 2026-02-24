import mongoose from "mongoose";
import { env } from "utils/env";

export const initMongoDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_STRING);
    console.log(`Mongo connection successfully established!`);
  } catch (error) {
    console.log(`error connect mongoDB, ${error}`);
  }
};
