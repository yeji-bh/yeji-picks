import { getAssetBaseUrl } from "@/lib/asset-base";
import { uploadPathToObjectKey } from "@/lib/upload-path";

/** Optional CDN / object-storage base URL for uploaded images. */
export function assetUrl(path: string): string {
  if (!path || path.startsWith("http") || path.startsWith("blob:")) {
    return path;
  }
  const base = getAssetBaseUrl();
  if (!base) return path;

  const objectPath = path.startsWith("/uploads/")
    ? uploadPathToObjectKey(path)
    : path.startsWith("/")
      ? path.slice(1)
      : path;

  return `${base}/${objectPath}`;
}
