export const asString = (value) => (typeof value === "string" ? value.trim() : "");

export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const parsePagination = (query, defaultLimit = 10, maxLimit = 50) => {
  const page = Math.max(parseInt(asString(query.page), 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(asString(query.limit), 10) || defaultLimit, 1),
    maxLimit,
  );

  return { page, limit, skip: (page - 1) * limit };
};

export const pageMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.max(Math.ceil(total / limit), 1),
});

export const countsByKey = (rows) =>
  rows.reduce((accumulator, row) => ({ ...accumulator, [row._id]: row.count }), {});
