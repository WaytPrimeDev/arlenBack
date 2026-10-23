import { z } from "zod";
import { KittenStatus } from "../interface/kittenTypes";

// Текст уходит подписью к первому фото альбома, а Telegram ограничивает
// caption 1024 символами — лишнее отрезать нельзя, иначе пост выйдет рваным.
export const TELEGRAM_CAPTION_LIMIT = 1024;

export const publishKittenSchema = z.object({
  text: z.string().trim().min(1).max(TELEGRAM_CAPTION_LIMIT),
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
  text: z.string().trim().min(1).max(TELEGRAM_CAPTION_LIMIT),
  status: z.enum(KittenStatus).optional(),
});

export type AnnounceKittenInput = z.infer<typeof announceKittenSchema>;
