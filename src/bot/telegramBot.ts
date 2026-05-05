// import { Telegraf, Markup } from "telegraf";
// import { env } from "utils/env";
// import { getUserInfo } from "./telegramAction.ts/botController";

// const bot = new Telegraf(env.MY_TEST_TG_BOT);

// bot.start((ctx) => {
//   return ctx.reply(
//     "Меню:",
//     Markup.inlineKeyboard([
//       Markup.button.callback("Помощь", "help"),
//       Markup.button.callback("Инфо", "info"),
//     ]),
//   );
// });

// bot.action("help", (ctx) => {
//   ctx.answerCbQuery();
//   ctx.reply("Это раздел помощи");
// });

// bot.action("info", (ctx) => {
//   ctx.answerCbQuery();
//   ctx.reply("Информация...");
// });

// bot.command("help", async (ctx) => {
//   const userInfo = await getUserInfo("qwer");
//   ctx.reply(userInfo);
// });

// export const startTelegramBot = () => {
//   bot.launch();
//   console.log("Telegram bot started");
// };
