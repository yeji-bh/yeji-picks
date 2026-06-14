import { hasAssetBaseUrl } from "@/lib/asset-base";

/** Whether uploads are served from R2/CDN (vs local /uploads). */
export function useCdnDirectImages(): boolean {
  return hasAssetBaseUrl();
}

type CdnImageOptions = {
  /** Force Next.js optimizer (not reliable on Cloudflare Workers without extra setup). */
  optimized?: boolean;
  unoptimized?: boolean;
};

/**
 * R2/CDN images load directly from the public URL — required on OpenNext +
 * Cloudflare Workers where `/_next/image` is unavailable by default.
 */
export function cdnImageProps(
  options: CdnImageOptions = {}
): { unoptimized?: true } {
  if (options.optimized) return {};
  if (options.unoptimized) return { unoptimized: true };
  return useCdnDirectImages() ? { unoptimized: true } : {};
}
