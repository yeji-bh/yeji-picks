import { DEFAULT_ITEM_SORT, type ItemSort, parseItemSort } from "@/lib/item-sort";
import {
  DEFAULT_OUTFIT_SORT,
  type OutfitSort,
  parseOutfitSort,
} from "@/lib/outfit-sort";
import type { HomeViewMode } from "@/lib/home-view-mode";

export const HOME_SORT_KEY = "yeji-outfits-home-sort";
export const HOME_ITEM_SORT_KEY = "yeji-outfits-home-item-sort";

export type HomeSort = OutfitSort | ItemSort;

export function getSavedSort(mode: HomeViewMode): HomeSort {
  if (typeof window === "undefined") {
    return mode === "item" ? DEFAULT_ITEM_SORT : DEFAULT_OUTFIT_SORT;
  }
  try {
    if (mode === "item") {
      return parseItemSort(localStorage.getItem(HOME_ITEM_SORT_KEY));
    }
    return parseOutfitSort(localStorage.getItem(HOME_SORT_KEY));
  } catch {
    return mode === "item" ? DEFAULT_ITEM_SORT : DEFAULT_OUTFIT_SORT;
  }
}

export function setSavedSort(sort: HomeSort, mode: HomeViewMode): void {
  if (mode === "item") {
    localStorage.setItem(HOME_ITEM_SORT_KEY, sort);
    return;
  }
  localStorage.setItem(HOME_SORT_KEY, sort);
}
