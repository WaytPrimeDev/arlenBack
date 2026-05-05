import { FamilyModel } from "../db/model/family/FamilyModel";
import { KittenModel } from "../db/model/cats/KittenModel";
import { ParentModel } from "../db/model/cats/ParentModel";
import createHttpError from "http-errors";

export interface CreateFamilyData {
  name: string;
  parents: {
    mom: string;
    dad: string;
  };
  kittens: string[];
}

//<------------------------------------------------------------------------------------------------------>//
// СОЗДАНИЕ СЕМЬИ (Family)
//<------------------------------------------------------------------------------------------------------>//

export const createFamilyService = async (data: CreateFamilyData) => {
  // 1. Создаем документ семьи
  const family = await FamilyModel.create({
    name: data.name,
    parents: {
      mom: data.parents.mom,
      dad: data.parents.dad,
    },
    kittens: data.kittens,
  });

  // 2. Добавляем ID котят в массивы Kittens у мамы и папы (используем $addToSet для избежания дубликатов)
  if (data.parents.mom) {
    await ParentModel.updateOne(
      { _id: data.parents.mom },
      {
        $addToSet: {
          Kittens: { $each: data.kittens },
          familyId: family._id,
        },
      },
    );
  }

  if (data.parents.dad) {
    await ParentModel.updateOne(
      { _id: data.parents.dad },
      {
        $addToSet: {
          Kittens: { $each: data.kittens },
          familyId: family._id,
        },
      },
    );
  }

  // 3. Обновляем документы котят: записываем ID мамы, папы и семьи
  await KittenModel.updateMany(
    { _id: { $in: data.kittens } },
    {
      $set: {
        "parentId.mom": data.parents.mom,
        "parentId.dad": data.parents.dad,
        familyId: family._id,
      },
    },
  );

  return {
    ...family.toObject(),
    parents: {
      mom: family.parents.mom?.toString() || null,
      dad: family.parents.dad?.toString() || null,
    },
    kittens: family.kittens.map((id) => id.toString()),
  };
};

export const getFamiliesServices = async () => {
  const families = await FamilyModel.find();
  return families;
};

//<------------------------------------------------------------------------------------------------------>//
// УДАЛЕНИЕ СЕМЬИ (Family)
//<------------------------------------------------------------------------------------------------------>//

export const deleteFamilyService = async (familyId: string) => {
  // 1. Проверяем, существует ли семья в БД
  const family = await FamilyModel.findById(familyId);
  if (!family) {
    throw createHttpError(404, "Family not found");
  }
  const { kittens, parents } = family;
  // 2. Опционально: очищаем ссылки на семью у котят
  await KittenModel.updateMany(
    { familyId: familyId },
    { $set: { familyId: null } },
  );

  const parentIds = [parents.mom, parents.dad].filter(Boolean);

  if (parentIds.length > 0) {
    await ParentModel.updateMany(
      { _id: { $in: parentIds } },
      {
        $pull: {
          // Удаляем только тех котят, которые были в этой семье
          Kittens: { $in: kittens },
          // Удаляем только этот ID семьи из списка семей родителя
          families: familyId,
        },
      },
    );
  }
  // 3. Удаляем документ семьи из БД
  await FamilyModel.findByIdAndDelete(familyId);

  return { message: "Family successfully deleted" };
};

//<------------------------------------------------------------------------------------------------------>//
// ОБНОВЛЕНИЕ СЕМЬИ (Family) - С СИНХРОНИЗАЦИЕЙ ДВУНАПРАВЛЕННЫХ СВЯЗЕЙ
//<------------------------------------------------------------------------------------------------------>//

interface UpdateFamilyData {
  name?: string;
  displayOrder?: number; // Порядок отображения в UI
  parents?: {
    mom?: string | null;
    dad?: string | null;
  };
  kittens?: string[]; // Новый массив котят
}

export const updateFamilyService = async (
  familyId: string,
  data: UpdateFamilyData,
) => {
  // 1. Проверяем, существует ли семья в БД
  const family = await FamilyModel.findById(familyId);
  if (!family) {
    throw createHttpError(404, "Family not found");
  }

  // 2. Подготавливаем данные для обновления (обновляем только переданные поля)
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.displayOrder !== undefined)
    updateData.displayOrder = data.displayOrder;

  // 3. СИНХРОНИЗАЦИЯ РОДИТЕЛЕЙ
  // Если передали новых родителей, нужно синхронизировать связи
  if (data.parents) {
    const oldParentIds = [family.parents?.mom, family.parents?.dad]
      .filter((id): id is any => Boolean(id))
      .map((id) => id.toString());
    const newParentIds = [data.parents.mom, data.parents.dad]
      .filter((id): id is string | any => Boolean(id))
      .map((id) => (typeof id === "string" ? id : (id as any).toString()));

    // Вычисляем, каких родителей нужно удалить из семьи (они больше не родители этой семьи)
    const parentsToRemove = oldParentIds.filter(
      (id) => !newParentIds.includes(id),
    );

    // Вычисляем, каких родителей нужно добавить к семье (они новые)
    const parentsToAdd = newParentIds.filter(
      (id) => !oldParentIds.includes(id),
    );

    // УДАЛЯЕМ ЭТУ СЕМЬЮ ИЗ familyId родителей, которых убрали
    if (parentsToRemove.length > 0) {
      await ParentModel.updateMany(
        { _id: { $in: parentsToRemove } },
        { $pull: { familyId: familyId } },
      );
    }

    // ДОБАВЛЯЕМ ЭТУ СЕМЬЮ В familyId новых родителей
    if (parentsToAdd.length > 0) {
      await ParentModel.updateMany(
        { _id: { $in: parentsToAdd } },
        { $addToSet: { familyId: familyId } },
      );
    }

    // Обновляем данные родителей в документе семьи
    updateData.parents = {
      mom: data.parents.mom || null,
      dad: data.parents.dad || null,
    };
  }

  // 4. СИНХРОНИЗАЦИЯ КОТЯТ
  // Если передали новый массив котят, нужно синхронизировать связи
  if (data.kittens) {
    const oldKittenIds = family.kittens?.map((id) => id.toString()) || [];
    const newKittenIds = data.kittens.map((id) => id.toString());

    // Вычисляем, каких котят удалили из семьи
    const kittensToRemove = oldKittenIds.filter(
      (id) => !newKittenIds.includes(id),
    );

    // Вычисляем, каких котят добавили в семью
    const kittensToAdd = newKittenIds.filter(
      (id) => !oldKittenIds.includes(id),
    );

    // УДАЛЯЕМ familyId ИЗ КОТЯТ, КОТОРЫХ ВЫГНАЛИ ИЗ СЕМЬИ
    if (kittensToRemove.length > 0) {
      await KittenModel.updateMany(
        { _id: { $in: kittensToRemove } },
        { $set: { familyId: null } },
      );
    }

    // ДОБАВЛЯЕМ familyId НОВЫМ КОТЯТАМ И СИНХРОНИЗИРУЕМ РОДИТЕЛЕЙ
    if (kittensToAdd.length > 0) {
      // Определяем родителей из семьи (или из переданных данных)
      const momId = data.parents?.mom || family.parents?.mom || null;
      const dadId = data.parents?.dad || family.parents?.dad || null;

      await KittenModel.updateMany(
        { _id: { $in: kittensToAdd } },
        {
          $set: {
            familyId: familyId,
            "parentId.mom": momId,
            "parentId.dad": dadId,
          },
        },
      );

      // Обновляем массивы Kittens у родителей
      if (momId) {
        await ParentModel.updateOne(
          { _id: momId },
          { $addToSet: { Kittens: { $each: kittensToAdd } } },
        );
      }
      if (dadId) {
        await ParentModel.updateOne(
          { _id: dadId },
          { $addToSet: { Kittens: { $each: kittensToAdd } } },
        );
      }
    }

    // Обновляем массив котят в документе семьи
    updateData.kittens = newKittenIds;
  }

  // 5. Обновляем документ семьи в БД
  const updatedFamily = await FamilyModel.findByIdAndUpdate(
    familyId,
    updateData,
    { new: true },
  );

  return {
    ...updatedFamily?.toObject(),
    parents: {
      mom: updatedFamily?.parents?.mom?.toString() || null,
      dad: updatedFamily?.parents?.dad?.toString() || null,
    },
    kittens: updatedFamily?.kittens?.map((id: any) => id.toString()) || [],
  };
};
