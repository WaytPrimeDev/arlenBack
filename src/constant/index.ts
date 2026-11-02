import path from "node:path";
import os from "node:os";

export const WEEK = 1000 * 60 * 60 * 24 * 60;
export const MONTH = WEEK * 4;

const STORAGE_ROOT = process.env.STORAGE_DIR || os.tmpdir();

export const TEMP_UPLOAD_DIR = path.join(STORAGE_ROOT, "temp");
export const UPLOAD_DIR = path.join(STORAGE_ROOT, "uploads");
