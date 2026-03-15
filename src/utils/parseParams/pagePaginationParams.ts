const parseInt = (num: string, defaultValue: number): number => {
  const parsed = Number(num);
  return isNaN(parsed) ? defaultValue : Math.floor(parsed);
};

export const parsePaginationParams = (page: string, perPage: string) => {
  let pageNumber = parseInt(page, 1);
  let perPageNumber = parseInt(perPage, 10);
  if (pageNumber < 0) pageNumber = 1;
  if (perPageNumber < 0) perPageNumber = 10;
  return {
    page: pageNumber,
    perPage: perPageNumber,
  };
};
