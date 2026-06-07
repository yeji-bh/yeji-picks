import { ITEM_TYPES, normalizeItemType } from "@/lib/types";

export const OUTFIT_SORT_OPTIONS = [
  "newest",
  "oldest",
  "date_desc",
  "date_asc",
  "name_asc",
  "name_desc",
  "category",
] as const;

export type OutfitSort = (typeof OUTFIT_SORT_OPTIONS)[number];

export const DEFAULT_OUTFIT_SORT: OutfitSort = "date_desc";

export function parseOutfitSort(value: string | null | undefined): OutfitSort {
  if (value && (OUTFIT_SORT_OPTIONS as readonly string[]).includes(value)) {
    return value as OutfitSort;
  }
  return DEFAULT_OUTFIT_SORT;
}

export function categorySortIndex(itemTypes: string[]): number {
  if (itemTypes.length === 0) return ITEM_TYPES.length;
  const indices = itemTypes.map((type) => {
    const normalized = normalizeItemType(type);
    const index = ITEM_TYPES.indexOf(normalized);
    return index >= 0 ? index : ITEM_TYPES.length;
  });
  return Math.min(...indices);
}

export function compareOutfitsByCategory<
  T extends { itemTypes: string[]; createdAt?: Date | string },
>(a: T, b: T): number {
  const diff = categorySortIndex(a.itemTypes) - categorySortIndex(b.itemTypes);
  if (diff !== 0) return diff;
  const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return bTime - aTime;
}
