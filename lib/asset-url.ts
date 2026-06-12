import { getAssetBaseUrl } from "@/lib/asset-base";
import { uploadPathToObjectKey } from "@/lib/upload-path";

/** Optional CDN / object-storage base URL for uploaded images. */
export function assetUrl(path: string): string {
  if (!path || path.startsWith("http") || path.startsWith("blob:")) {
    return path;
  }

  const objectPath = path.startsWith("/uploads/")
    ? uploadPathToObjectKey(path)
    : path.startsWith("/")
      ? path.slice(1)
      : path;

  const base = getAssetBaseUrl();
  if (base) return `${base}/${objectPath}`;

  const publicBase = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(/\/$/, "");
  if (publicBase) return `${publicBase}/${objectPath}`;

  return path;
}

/** Swap .webp ↔ .png for migrated uploads. */
export function alternateUploadPath(path: string): string | null {
  if (path.endsWith(".webp")) return path.replace(/\.webp$/, ".png");
  if (path.endsWith(".png")) return path.replace(/\.png$/, ".webp");
  return null;
}

/** Build image src for retry attempts (cache-bust + extension fallback). */
export function assetUrlForAttempt(path: string, attempt: number): string {
  if (!path || attempt <= 0) return assetUrl(path);

  const altPath = alternateUploadPath(path);
  const pathForAttempt = attempt >= 2 && altPath ? altPath : path;
  const url = assetUrl(pathForAttempt);
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}r=${attempt}`;
}
