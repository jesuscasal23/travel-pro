/**
 * Parse pagination parameters from a request URL.
 * Defaults: page=1, limit=20, max limit=50.
 */
export function parsePaginationParams(url: URL) {
  const rawPage = Number(url.searchParams.get("page") ?? "1");
  const rawLimit = Number(url.searchParams.get("limit") ?? "20");
  return {
    page: Math.max(1, Number.isFinite(rawPage) ? rawPage : 1),
    limit: Math.min(50, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 20)),
    search: url.searchParams.get("search") ?? "",
  };
}

/** Build the pagination metadata for a list response. */
export function paginationMeta(total: number, page: number, limit: number) {
  return { total, page, totalPages: Math.ceil(total / limit) };
}
