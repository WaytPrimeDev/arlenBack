import createHttpError from "http-errors";
import { FamilyModel } from "../../db/model/family/FamilyModel";
import { BreedModel } from "../../db/model/filters/BreedModel";

export const getFamiliesClientServices = async (
  page: number,
  perPage: number,
  breed?: string,
) => {
  const skipCount = (page - 1) * perPage;
  const validationPromises: Promise<void>[] = [];

  // 1. Динамически собираем фильтр
  const filter: any = {};
  if (breed) {
    filter.breed = breed;
  }
  if (breed) {
    validationPromises.push(
      (async () => {
        const breedExists = await BreedModel.findOne({ name: breed }).lean();
        if (!breedExists) {
          throw createHttpError(
            400,
            `Порода "${breed}" не существует в базе данных`,
          );
        }
      })(),
    );
  }
  if (validationPromises.length > 0) {
    await Promise.all(validationPromises);
  }

  // 2. Запускаем подсчет и поиск параллельно
  const [totalItems, items] = await Promise.all([
    FamilyModel.countDocuments(filter), // Считаем только те семьи, которые подходят под фильтр
    FamilyModel.find(filter) // Ищем нужную страницу
      .sort({ displayOrder: 1 }) // Сортируем по порядку отображения (0, 1, 2...)
      .skip(skipCount)
      .limit(perPage)
      .lean(), // Ускоряем чтение "только для вывода"
  ]);

  const totalPages = Math.ceil(totalItems / perPage);

  return {
    items,
    pagination: {
      page,
      perPage,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};
