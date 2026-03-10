import path from "node:path";

export const WEEK = 1000 * 60 * 60 * 24 * 60;
export const MONTH = WEEK * 4;

export const TEMP_UPLOAD_DIR = path.join(process.cwd(), "temp");
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
