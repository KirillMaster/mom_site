export const parseBlogPage = (raw: string | string[] | undefined) => {
  const page = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(page) && page > 1 ? page : 1;
};
