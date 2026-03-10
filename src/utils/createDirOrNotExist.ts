import fs from "node:fs/promises";

export const createDirIfNotExists = async (pathDir: string) => {
  await fs.mkdir(pathDir, { recursive: true });
};
