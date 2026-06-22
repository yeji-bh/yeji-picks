import { assetUrl } from "@/lib/asset-url";
import { objectKeyToUploadPath, uploadPathToObjectKey } from "@/lib/upload-path";

const THUMB_MISS_PREFIX = "grid-thumb-miss:";

/** R2 object key for a grid thumbnail (`uuid.webp` → `uuid_t.webp`). */
export function thumbObjectKey(key: string): string {
  if (!key.endsWith(".webp")) return key;
  return key.replace(/\.webp$/, "_t.webp");
}

/** DB upload path for the grid thumbnail variant. */
export function thumbUploadPath(uploadPath: string): string {
  return objectKeyToUploadPath(thumbObjectKey(uploadPathToObjectKey(uploadPath)));
}

/** Opt-in after all R2 objects have matching `_t.webp` (see scripts/generate-thumbs.mjs). */
export function isGridThumbsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GRID_THUMBS === "1";
}

export function isGridThumbKnownMissing(uploadPath: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(`${THUMB_MISS_PREFIX}${uploadPath}`) === "1";
  } catch {
    return false;
  }
}

/** Remember a missing thumb so we stop requesting it (avoids ORB on 404 non-image bodies). */
export function markGridThumbMissing(uploadPath: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${THUMB_MISS_PREFIX}${uploadPath}`, "1");
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Grid image URL. Defaults to the full image — most legacy uploads have no `_t.webp`.
 * Enable `NEXT_PUBLIC_GRID_THUMBS=1` after batch-generating thumbs on R2.
 */
export function gridImageSrc(
  uploadPath: string | null | undefined,
  fullSrc: string
): string {
  if (
    !uploadPath ||
    !isGridThumbsEnabled() ||
    isGridThumbKnownMissing(uploadPath)
  ) {
    return fullSrc;
  }
  return assetUrl(thumbUploadPath(uploadPath));
}
