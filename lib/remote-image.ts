import { hasAssetBaseUrl } from "@/lib/asset-base";

/** Whether uploads are served from R2/CDN (vs local /uploads). */
export function useCdnDirectImages(): boolean {
  return hasAssetBaseUrl();
}

type CdnImageOptions = {
  /** Force Next.js optimizer (may be slow/unavailable on Cloudflare Workers). */
  optimized?: boolean;
  /** Force direct CDN bytes (fast parallel fetch from R2). */
  unoptimized?: boolean;
};

/**
 * Grid/list thumbnails default to direct CDN on R2 — avoids blocking on
 * `/_next/image` worker round-trips. Pass `{ optimized: true }` when
 * resizing via Next optimizer is confirmed working in production.
 */
export function cdnImageProps(
  options: CdnImageOptions = {}
): { unoptimized?: true } {
  if (options.optimized) return {};
  if (options.unoptimized) return { unoptimized: true };
  return useCdnDirectImages() ? { unoptimized: true } : {};
}
