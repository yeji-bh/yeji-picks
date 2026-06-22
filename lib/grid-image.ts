/** Grid card image caps: mobile ≤400px, desktop ≤600px (matches sizes below). */
export const GRID_IMAGE_SIZES =
  "(max-width: 640px) min(50vw, 400px), (max-width: 1280px) min(33vw, 600px), 600px";

/** CDN resize width for grid / cover thumbnails (mobile LCP target). */
export const GRID_IMAGE_WIDTH = 400;

/** CDN resize width for small list thumbnails (perfume row, etc.). */
export const LIST_THUMB_WIDTH = 128;

export const GRID_IMAGE_QUALITY = 72;

/** Only the first visible grid card may use LCP priority hints. */
export function isGridLcpCandidate(index: number): boolean {
  return index === 0;
}
