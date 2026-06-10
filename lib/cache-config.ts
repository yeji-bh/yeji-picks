/** ISR interval for public catalog pages (home, outfit, item, brand). */
export const PUBLIC_PAGE_REVALIDATE = 3600;

/** CDN cache for public JSON list/detail APIs. */
export const PUBLIC_API_CACHE =
  "public, s-maxage=3600, stale-while-revalidate=86400";

/** CDN cache for paginated list first page. */
export const PUBLIC_LIST_CACHE =
  "public, s-maxage=600, stale-while-revalidate=3600";
