import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  PORT: z.string().default("4000"),
  MONGODB_STRING: z.string(),
  SALT_ROUNDS: z.string(),
  JWT_SECRET: z.string(),
  TG_BOT_TOKEN_TEST: z.string().optional(),
  API_NAME_CLOUD: z.string(),
  API_SECRET_CLOUD: z.string(),
  API_KEY_CLOUD: z.string(),
  TELEGRAM_CHANNEL_ID: z.string(),
  TG_BOT_TOKEN_OFFICIAL: z.string(),
});

export const env = envSchema.parse(process.env);
