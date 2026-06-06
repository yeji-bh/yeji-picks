/** Optional CDN / object-storage base URL for uploaded images. */
export function assetUrl(path: string): string {
  if (!path || path.startsWith("http") || path.startsWith("blob:")) {
    return path;
  }
  const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(/\/$/, "");
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
