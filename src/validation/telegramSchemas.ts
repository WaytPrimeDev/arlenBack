import { z } from "zod";
import { KittenStatus } from "../interface/kittenTypes";
import { htmlVisibleLength } from "../utils/telegramHtml";

// Текст уходит подписью к первому фото альбома, а Telegram ограничивает
// caption 1024 символами — лишнее отрезать нельзя, иначе пост выйдет рваным.
export const TELEGRAM_CAPTION_LIMIT = 1024;

// Текст приходит с клиента HTML-шаблоном, а лимит Telegram считает по видимым
// символам — теги в него не входят, поэтому меряем длину без разметки.
const withinCaptionLimit = (text: string) =>
  htmlVisibleLength(text) <= TELEGRAM_CAPTION_LIMIT;

const captionText = z
  .string()
  .trim()
  .min(1)
  .refine(withinCaptionLimit, {
    message: `Текст длиннее ${TELEGRAM_CAPTION_LIMIT} символов`,
  });

export const publishKittenSchema = z.object({
  text: captionText,
});

export type PublishKittenInput = z.infer<typeof publishKittenSchema>;

// Разделитель между объявлением и исходной подписью поста
export const ANNOUNCEMENT_SEPARATOR = "\n\n";

/**
 * Объявление поверх существующего поста.
 * Исходную подпись брать от клиента не нужно: она лежит в TelegramPostModel.caption.
 * Суммарную длину с ней проверяет контроллер — здесь известен только text.
 * status — необязательный: если пришёл и отличается от текущего, записываем.
 */
export const announceKittenSchema = z.object({
  text: captionText,
  status: z.enum(KittenStatus).optional(),
});

export type AnnounceKittenInput = z.infer<typeof announceKittenSchema>;
