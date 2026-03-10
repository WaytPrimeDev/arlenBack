import { initMongoDB } from "db/initMongoDB";
import { startServer } from "server";
import { startTelegramBot } from "./bot/telegramBot";
import { TEMP_UPLOAD_DIR, UPLOAD_DIR } from "constant";
import { createDirIfNotExists } from "utils/createDirOrNotExist";

const bootstrap = async () => {
  await initMongoDB();
  await createDirIfNotExists(TEMP_UPLOAD_DIR);
  await createDirIfNotExists(UPLOAD_DIR);
  startServer();
  startTelegramBot();
};
bootstrap();
