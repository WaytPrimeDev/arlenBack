import createHttpError from "http-errors";
import { KittenModel } from "../../db/model/cats/KittenModel";
import { ParentModel } from "../../db/model/cats/ParentModel";
import { BreedModel } from "../../db/model/filters/BreedModel";
import { ColorModel } from "../../db/model/filters/ColorModel";

export const getParentClientService = async (page: number, perPage: number) => {
  const skipCount = (page - 1) * perPage;

  // Создаем единый фильтр: только те родители, у которых есть familyId
  const filter = { familyId: { $ne: null, $exists: true } };

  // Запускаем оба запроса параллельно
  const [totalItems, items] = await Promise.all([
    ParentModel.countDocuments(filter), // Считаем только отфильтрованных
    ParentModel.find(filter) // Ищем только отфильтрованных
      .sort({ createdAt: -1 })
      .skip(skipCount)
      .limit(perPage),
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

export const getKittensClientService = async (
  page: number,
  perPage: number,
  color?: string,
  breed?: string,
) => {
  const skipCount = (page - 1) * perPage;

  // 1. Базовый фильтр: только котята, у которых железно есть семья
  const matchStage: any = {
    familyId: { $ne: null, $exists: true },
  };
  const validationPromises: Promise<void>[] = [];
  if (color) {
    validationPromises.push(
      (async () => {
        const colorExists = await ColorModel.findOne({ name: color }).lean();
        if (!colorExists) {
          throw createHttpError(
            400,
            `Цвет "${color}" не существует в базе данных`,
          );
        }
      })(),
    );
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

  // Ждем завершения проверок. Если хоть одна упадет с ошибкой (throw), выполнение прервется
  if (validationPromises.length > 0) {
    await Promise.all(validationPromises);
  }

  // Если передан цвет, добавляем его в условия поиска
  if (color) {
    matchStage.color = color;
  }

  // Если передана порода, добавляем её в условия поиска
  if (breed) {
    matchStage.breed = breed;
  }

  const result = await KittenModel.aggregate([
    // Применяем динамический фильтр на самом первом шаге для максимальной скорости!
    { $match: matchStage },

    // 2. Подтягиваем данные о семье из коллекции 'families'
    {
      $lookup: {
        from: "families",
        localField: "familyId",
        foreignField: "_id",
        as: "familyData",
      },
    },

    // 3. Распаковываем массив семьи
    {
      $unwind: {
        path: "$familyData",
        preserveNullAndEmptyArrays: false,
      },
    },

    // 4. Сортируем: сначала по displayOrder семьи, затем по свежести котят
    {
      $sort: {
        "familyData.displayOrder": 1,
        createdAt: -1,
      },
    },

    // 5. Пагинация и подсчет общего количества с учетом примененных фильтров
    {
      $facet: {
        metadata: [{ $count: "totalItems" }],
        items: [
          { $skip: skipCount },
          { $limit: perPage },

          // Очищаем временный объект семьи перед отправкой JSON
          {
            $project: {
              familyData: 0,
            },
          },
        ],
      },
    },
  ]);

  const items = result[0].items;
  const totalItems = result[0].metadata[0]?.totalItems || 0;
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

export const getKittenByIdClientService = async (id: string) => {
  const kitten = await KittenModel.findById(id).lean();
  if (!kitten) {
    throw createHttpError(404, "Kitten not found");
  }
  return kitten;
};

export const getParentByIdClientService = async (id: string) => {
  const parent = await ParentModel.findById(id).lean();
  if (!parent) {
    throw createHttpError(404, "Parent not found");
  }
  return parent;
};
