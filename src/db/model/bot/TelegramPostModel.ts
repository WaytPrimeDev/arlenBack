import { Schema, model } from "mongoose";

const telegramPostSchema = new Schema(
  {
    kittenId: { type: Schema.Types.ObjectId, ref: "Kitten", required: true },
    messageId: { type: Number, required: true },
    chatId: { type: String, required: true },

    // Полезно для админки: прямая ссылка на пост, чтобы можно было кликнуть и посмотреть
    postUrl: { type: String, default: null },

    // Чтобы понимать, актуален ли пост (например, если котенка купили, а в ТГ статус еще не обновили)
    status: { type: String, default: "published" },
  },
  { timestamps: true },
);

export const TelegramPostModel = model("TelegramPost", telegramPostSchema);
