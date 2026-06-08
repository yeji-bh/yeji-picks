/** R2/CDN images are already WebP — skip Next.js optimizer round-trip. */
export function useCdnDirectImages(): boolean {
  return !!process.env.NEXT_PUBLIC_ASSET_BASE_URL;
}

export function cdnImageProps(): { unoptimized?: true } {
  return useCdnDirectImages() ? { unoptimized: true } : {};
}
