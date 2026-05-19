import { Request, Response } from "express";
import { parsePaginationParams } from "../../utils/parseParams/pagePaginationParams";
import { getFamiliesClientServices } from "../../services/clientServices/familyClientServices";
// Убедитесь, что импортировали parsePaginationParams и ваш сервис

export const getFamiliesClientController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // 1. Достаем параметры пагинации из query-параметров
  const { page = 1, perPage = 20 } = parsePaginationParams(
    req.query.page as string,
    req.query.perPage as string,
  );

  // 2. Получаем породу для фильтрации (если она передана)
  const breed = req.query.breed as string | undefined;

  // 3. Вызываем сервис
  const { items, pagination } = await getFamiliesClientServices(
    page,
    perPage,
    breed,
  );

  // 4. Отдаем стандартизированный ответ фронтенду
  res.json({
    status: 200,
    message: "Successfully retrieved families",
    data: items,
    pagination,
  });
};
