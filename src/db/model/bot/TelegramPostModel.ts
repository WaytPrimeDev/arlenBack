import { Schema, model } from "mongoose";

const telegramPostSchema = new Schema(
  {
    kittenId: { type: Schema.Types.ObjectId, ref: "Kitten", required: true },
    messageId: { type: Number, required: true },
    chatId: { type: String, required: true },

    // Подпись поста в том виде, в каком она ушла при публикации. Bot API не даёт
    // боту прочитать подпись своего сообщения, а editMessageCaption перезаписывает
    // её целиком — без этого текста объявление не собрать. Объявления её не трогают.
    caption: { type: String, required: true },

    // Текст последнего объявления: появляется при первом объявлении и
    // перезаписывается при изменении. Подпись поста при этом остаётся как была.
    announcement: { type: String, default: null },

    // ID сообщения-объявления (ответа на пост). Нужен, чтобы повторный вызов
    // правил уже отправленное объявление, а не плодил новые сообщения.
    announcementMessageId: { type: Number, default: null },

    // Полезно для админки: прямая ссылка на пост, чтобы можно было кликнуть и посмотреть
    postUrl: { type: String, default: null },

    // Чтобы понимать, актуален ли пост (например, если котенка купили, а в ТГ статус еще не обновили)
    status: { type: String, default: "published" },
  },
  { timestamps: true },
);

export const TelegramPostModel = model("TelegramPost", telegramPostSchema);
