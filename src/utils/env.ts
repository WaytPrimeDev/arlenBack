import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  PORT: z.string().default("4000"),
  MONGODB_STRING: z.string(),
  SALT_ROUNDS: z.string(),
});

export const env = envSchema.parse(process.env);
