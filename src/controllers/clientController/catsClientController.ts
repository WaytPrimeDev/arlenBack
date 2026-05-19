import { Request, Response } from "express";
import { parsePaginationParams } from "../../utils/parseParams/pagePaginationParams";
import {
  getKittenByIdClientService,
  getKittensClientService,
  getParentByIdClientService,
  getParentClientService,
} from "../../services/clientServices/сatsClientServices";

export const getParentController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // 1. Получаем параметры из query (иначе req оставался неиспользованным)
  const { page = 1, perPage = 20 } = parsePaginationParams(
    req.query.page as string,
    req.query.perPage as string,
  );

  // 2. Вызываем правильный сервис и передаем ему аргументы
  const { items, pagination } = await getParentClientService(page, perPage);

  // 3. Отдаем стандартизированный ответ
  res.json({
    status: 200,
    message: "Successfully retrieved parents",
    data: items,
    pagination,
  });
};

export const getKittenByIdClientController = async (
  req: Request,
  res: Response,
) => {
  const { id } = req.params as { id: string };
  const kitten = await getKittenByIdClientService(id);

  res.json({
    message: "get kitten by id",
    data: kitten,
  });
};

export const getParentByIdClientController = async (
  req: Request,
  res: Response,
) => {
  const { id } = req.params as { id: string };
  const parent = await getParentByIdClientService(id);
  res.json({
    message: "get parent by id",
    data: parent,
  });
};

export const getKittensController = async (req: Request, res: Response) => {
  // 1. Извлекаем пагинацию
  const { page = 1, perPage = 20 } = parsePaginationParams(
    req.query.page as string,
    req.query.perPage as string,
  );

  // 2. Достаем фильтры из query-параметров
  const color = req.query.color as string | undefined;
  const breed = req.query.breed as string | undefined;

  // 3. Передаем всё в сервис
  const { items, pagination } = await getKittensClientService(
    page,
    perPage,
    color,
    breed,
  );

  res.json({
    message: "Successfully retrieved kittens",
    data: items,
    pagination,
  });
};
