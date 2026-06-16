export const GALLERY_SORT_OPTIONS = ["newest", "oldest"] as const;
export type GallerySort = (typeof GALLERY_SORT_OPTIONS)[number];
export const DEFAULT_GALLERY_SORT: GallerySort = "newest";

export function parseGallerySort(raw: string | null | undefined): GallerySort {
  return raw === "oldest" ? "oldest" : DEFAULT_GALLERY_SORT;
}
