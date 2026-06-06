import { DEFAULT_OUTFIT_SORT, type OutfitSort, parseOutfitSort } from "@/lib/outfit-sort";

export const HOME_SORT_KEY = "yeji-outfits-home-sort";

export function getSavedSort(): OutfitSort {
  if (typeof window === "undefined") return DEFAULT_OUTFIT_SORT;
  try {
    return parseOutfitSort(localStorage.getItem(HOME_SORT_KEY));
  } catch {
    return DEFAULT_OUTFIT_SORT;
  }
}

export function setSavedSort(sort: OutfitSort): void {
  localStorage.setItem(HOME_SORT_KEY, sort);
}
