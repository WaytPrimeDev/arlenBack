import { Request, Response } from "express";

import { env } from "../utils/env";
import { KittenModel } from "../db/model/cats/KittenModel";
import { TelegramPostModel } from "../db/model/bot/TelegramPostModel";
import { bot } from "../bot/telegramBot";
import createHttpError from "http-errors";

export const publishKittenToTelegram = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const chatId = env.TELEGRAM_CHANNEL_ID;

    if (!chatId) {
      throw createHttpError(500, "Не настроен ID Telegram чата/канала");
    }

    const kitten = await KittenModel.findById(id);
    if (!kitten) throw createHttpError(404, "Котенок не найден");

    const existingPost = await TelegramPostModel.findOne({ kittenId: id });
    if (existingPost) throw createHttpError(400, "Уже опубликовано");

    const messageText = `
🐾 **Новый котенок!**
  
😻 Имя: ${kitten.nameEn} (${kitten.nameUa})

🎨 Окрас: ${kitten.color}

⚧ Пол: ${kitten.sex === "male" ? "♂ Котик" : "♀ Кошечка"}

🏢 Порода: ${kitten.breed}

💰 Цена (В разведение): ${kitten.price.breeding !== "null" ? kitten.price.breeding : "Уточняйте"}
💰 Цена (Pet): ${kitten.price.pet !== "null" ? kitten.price.pet : "Уточняйте"}
    `.trim();

    console.log("ПРОБУЕМ ОТПРАВИТЬ В ЧАТ С ID:", `"${chatId}"`);

    // 1. Ограничение Telegram: максимум 10 фото в одном альбоме (Media Group)
    const imagesToSend = kitten.images.slice(0, 10);

    // 2. Формируем массив для отправки
    const mediaGroup = imagesToSend.map((img, index) => {
      const mediaItem: any = {
        type: "photo",
        media: img.full,
      };

      // 3. Добавляем текст только к ПЕРВОЙ фотографии в альбоме
      if (index === 0) {
        mediaItem.caption = messageText;
        mediaItem.parse_mode = "Markdown";
      }

      return mediaItem;
    });

    // 4. Отправляем альбом через sendMediaGroup
    const sentMessages = await bot.telegram.sendMediaGroup(chatId, mediaGroup);

    // В отличие от sendPhoto, sendMediaGroup возвращает МАССИВ сообщений.
    // Нам нужен ID первого сообщения, к которому привязан текст.
    const mainMessageId = sentMessages[0].message_id;

    // 5. Формируем универсальную ссылку на пост
    let postUrl = "";
    if (chatId.startsWith("-100")) {
      postUrl = `https://t.me/c/${chatId.replace("-100", "")}/${mainMessageId}`;
    } else if (chatId.startsWith("@")) {
      postUrl = `https://t.me/${chatId.replace("@", "")}/${mainMessageId}`;
    } else {
      postUrl = `https://t.me/telegram`; // Заглушка, если бот пишет в личку
    }

    // 6. Сохраняем в базу
    await TelegramPostModel.create({
      kittenId: id,
      messageId: mainMessageId,
      chatId: sentMessages[0].chat.id.toString(),
      postUrl: postUrl,
    });

    res.json({ success: true, message: "Опубликовано", postUrl });
  } catch (error: any) {
    console.error("TG Publish Error:", error);
    res.status(500).json({ message: error.message });
  }
};
