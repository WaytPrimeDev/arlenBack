import { z } from "zod";
import { KittenStatus, Sex } from "../interface/kittenTypes";
import { MAX_IMAGES } from "../utils/images";

// multipart передаёт массивы как JSON-строку: '["url1","url2"]'
const jsonArrayField = (field: string) =>
  z.string().transform((raw, context) => {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      context.addIssue({
        code: "custom",
        message: `${field} must be a JSON array`,
      });
      return z.NEVER;
    }
  });

const retainedImagesField = jsonArrayField("retainedImages").pipe(
  z.array(z.url()).max(MAX_IMAGES),
);

// Порядок фото целиком: full-URL сохранённого фото либо "new:<индекс файла>".
// Нужен, чтобы только что загруженное фото могло встать перед сохранёнными
// (первое фото итога — главное).
const imagesOrderField = jsonArrayField("imagesOrder").pipe(
  z.array(z.union([z.url(), z.string().regex(/^new:\d+$/)])).max(MAX_IMAGES),
);

const nonEmptyText = z.string().trim().min(1);

export const updateParentSchema = z.object({
  nameUa: nonEmptyText.optional(),
  nameEn: nonEmptyText.optional(),
  color: nonEmptyText.optional(),
  breed: nonEmptyText.optional(),
  sex: z.enum(Sex).optional(),
  // отсутствует → фото не трогаем; "[]" → удалить все старые
  retainedImages: retainedImagesField.optional(),
  // отсутствует → сохранённые фото, следом новые
  imagesOrder: imagesOrderField.optional(),
});

export const updateKittenSchema = updateParentSchema.extend({
  birthDay: z.coerce.date().optional(),
  status: z.enum(KittenStatus).optional(),
  // цены приходят плоскими полями формы; пустая строка — допустимое значение
  breeding: z.string().trim().optional(),
  pet: z.string().trim().optional(),
});

export type UpdateParentInput = z.infer<typeof updateParentSchema>;
export type UpdateKittenInput = z.infer<typeof updateKittenSchema>;
