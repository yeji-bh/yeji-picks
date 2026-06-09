import { hasAssetBaseUrl } from "@/lib/asset-base";

/** R2/CDN images are already WebP — skip Next.js optimizer round-trip. */
export function useCdnDirectImages(): boolean {
  return hasAssetBaseUrl();
}

export function cdnImageProps(): { unoptimized?: true } {
  return useCdnDirectImages() ? { unoptimized: true } : {};
}
