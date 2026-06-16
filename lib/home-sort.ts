import type { HomeViewMode } from "@/lib/home-view-mode";
import { DEFAULT_ITEM_SORT, type ItemSort, parseItemSort } from "@/lib/item-sort";
import {
  DEFAULT_GALLERY_SORT,
  type GallerySort,
  parseGallerySort,
} from "@/lib/gallery-sort";
import {
  DEFAULT_OUTFIT_SORT,
  type OutfitSort,
  parseOutfitSort,
} from "@/lib/outfit-sort";

export const HOME_SORT_KEY = "yeji-outfits-home-sort";
export const HOME_ITEM_SORT_KEY = "yeji-outfits-home-item-sort";
export const HOME_GALLERY_SORT_KEY = "yeji-outfits-home-gallery-sort";

export type HomeSort = OutfitSort | ItemSort | GallerySort;

export function getSavedSort(mode: HomeViewMode): HomeSort {
  if (typeof window === "undefined") {
    if (mode === "item") return DEFAULT_ITEM_SORT;
    if (mode === "nailArt" || mode === "phoneCase") return DEFAULT_GALLERY_SORT;
    return DEFAULT_OUTFIT_SORT;
  }
  try {
    if (mode === "item") {
      return parseItemSort(localStorage.getItem(HOME_ITEM_SORT_KEY));
    }
    if (mode === "nailArt" || mode === "phoneCase") {
      return parseGallerySort(localStorage.getItem(HOME_GALLERY_SORT_KEY));
    }
    return parseOutfitSort(localStorage.getItem(HOME_SORT_KEY));
  } catch {
    if (mode === "item") return DEFAULT_ITEM_SORT;
    if (mode === "nailArt" || mode === "phoneCase") return DEFAULT_GALLERY_SORT;
    return DEFAULT_OUTFIT_SORT;
  }
}

export function setSavedSort(sort: HomeSort, mode: HomeViewMode): void {
  if (mode === "item") {
    localStorage.setItem(HOME_ITEM_SORT_KEY, sort);
    return;
  }
  if (mode === "nailArt" || mode === "phoneCase") {
    localStorage.setItem(HOME_GALLERY_SORT_KEY, sort);
    return;
  }
  localStorage.setItem(HOME_SORT_KEY, sort);
}
