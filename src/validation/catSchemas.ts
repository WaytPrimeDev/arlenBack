import { z } from "zod";
import { KittenStatus, Sex } from "../interface/kittenTypes";

// multipart передаёт retainedImages как JSON-строку: '["url1","url2"]'
const retainedImagesField = z
  .string()
  .transform((raw, context) => {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      context.addIssue({
        code: "custom",
        message: "retainedImages must be a JSON array",
      });
      return z.NEVER;
    }
  })
  .pipe(z.array(z.url()).max(5));

const nonEmptyText = z.string().trim().min(1);

export const updateParentSchema = z.object({
  nameUa: nonEmptyText.optional(),
  nameEn: nonEmptyText.optional(),
  color: nonEmptyText.optional(),
  breed: nonEmptyText.optional(),
  sex: z.enum(Sex).optional(),
  // отсутствует → фото не трогаем; "[]" → удалить все старые
  retainedImages: retainedImagesField.optional(),
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
