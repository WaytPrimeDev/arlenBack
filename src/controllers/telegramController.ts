import { Request, Response } from "express";

import { env } from "../utils/env";
import { KittenModel } from "../db/model/cats/KittenModel";
import { TelegramPostModel } from "../db/model/bot/TelegramPostModel";
import { bot } from "../bot/telegramBot";
import createHttpError from "http-errors";
import { z } from "zod";

import {
  ANNOUNCEMENT_SEPARATOR,
  TELEGRAM_CAPTION_LIMIT,
  announceKittenSchema,
  publishKittenSchema,
} from "../validation/telegramSchemas";

export const publishKittenToTelegram = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const chatId = env.TELEGRAM_CHANNEL_ID;

  if (!chatId) {
    throw createHttpError(500, "Не настроен ID Telegram чата/канала");
  }

  // Текст поста приходит от клиента готовым — бэкенд его не собирает
  const parsed = publishKittenSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createHttpError(400, z.prettifyError(parsed.error));
  }
  const messageText = parsed.data.text;

  const kitten = await KittenModel.findById(id);
  if (!kitten) throw createHttpError(404, "Котенок не найден");

  const existingPost = await TelegramPostModel.findOne({ kittenId: id });
  if (existingPost) throw createHttpError(400, "Уже опубликовано");

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
    caption: messageText,
    postUrl: postUrl,
  });

  res.json({ success: true, message: "Опубликовано", postUrl });
};

// Telegram отвечает ошибкой, если новый текст совпал с текущим. Для нас это
// не сбой: пост уже в нужном виде.
const isNotModifiedError = (error: unknown) =>
  error instanceof Error && error.message.includes("message is not modified");

/**
 * Объявление поверх уже опубликованного поста:
 * 1. текст встаёт в самый верх подписи альбома, исходная подпись остаётся ниже;
 * 2. тот же текст уходит отдельным сообщением-ответом на этот пост.
 * Повторный вызов правит и подпись, и прошлое сообщение-ответ — новых сообщений
 * в канале не появляется.
 */
export const announceKittenPost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  const parsed = announceKittenSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createHttpError(400, z.prettifyError(parsed.error));
  }
  const { text, status } = parsed.data;

  const post = await TelegramPostModel.findOne({ kittenId: id });
  if (!post) throw createHttpError(404, "Пост не найден, сначала опубликуйте");

  const { chatId, messageId, caption } = post;

  // Посты, опубликованные до появления поля caption, собрать заново нельзя
  if (!caption) {
    throw createHttpError(409, "У поста не сохранена подпись, переопубликуйте");
  }

  const fullCaption = `${text}${ANNOUNCEMENT_SEPARATOR}${caption}`;
  if (fullCaption.length > TELEGRAM_CAPTION_LIMIT) {
    throw createHttpError(
      400,
      `Объявление с подписью поста не влезает в ${TELEGRAM_CAPTION_LIMIT} символов: ${fullCaption.length}`,
    );
  }

  // Статус пишем до отправки в Telegram: если Telegram упадёт, клиент повторит
  // запрос, а повтор с тем же статусом ничего не меняет
  let statusUpdated = false;
  if (status) {
    const kitten = await KittenModel.findById(id);
    if (!kitten) throw createHttpError(404, "Котенок не найден");

    if (kitten.status !== status) {
      kitten.status = status;
      await kitten.save();
      statusUpdated = true;
    }
  }

  // 1. Новый текст сверху, исходная подпись — без изменений под ним
  try {
    await bot.telegram.editMessageCaption(
      chatId,
      messageId,
      undefined,
      fullCaption,
      { parse_mode: "Markdown" },
    );
  } catch (error) {
    if (!isNotModifiedError(error)) throw error;
  }

  // 2. Сообщение-ответ: правим существующее либо отправляем первое
  if (post.announcementMessageId) {
    try {
      await bot.telegram.editMessageText(
        chatId,
        post.announcementMessageId,
        undefined,
        text,
        { parse_mode: "Markdown" },
      );
    } catch (error) {
      if (!isNotModifiedError(error)) throw error;
    }
  } else {
    const sent = await bot.telegram.sendMessage(chatId, text, {
      parse_mode: "Markdown",
      reply_parameters: { message_id: messageId },
    });

    post.announcementMessageId = sent.message_id;
  }

  // Текст объявления пишем отдельным полем: caption поста не трогаем
  post.announcement = text;
  await post.save();

  res.json({
    success: true,
    message: "Объявление обновлено",
    postUrl: post.postUrl,
    announcementMessageId: post.announcementMessageId,
    statusUpdated,
  });
};
