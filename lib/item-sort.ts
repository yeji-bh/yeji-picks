import { ITEM_TYPES, normalizeItemType } from "@/lib/types";
import { OUTFIT_SORT_OPTIONS, type OutfitSort } from "@/lib/outfit-sort";
import type { ItemSummary } from "@/lib/item-summary";

export const ITEM_SORT_OPTIONS = OUTFIT_SORT_OPTIONS;
export type ItemSort = OutfitSort;
export const DEFAULT_ITEM_SORT: ItemSort = "date_desc";

export function parseItemSort(value: string | null | undefined): ItemSort {
  if (value && (ITEM_SORT_OPTIONS as readonly string[]).includes(value)) {
    return value as ItemSort;
  }
  return DEFAULT_ITEM_SORT;
}

export function itemCategorySortIndex(type: string): number {
  const normalized = normalizeItemType(type);
  const index = ITEM_TYPES.indexOf(normalized);
  return index >= 0 ? index : ITEM_TYPES.length;
}

export function compareItemsByCategory(a: ItemSummary, b: ItemSummary): number {
  const diff = itemCategorySortIndex(a.type) - itemCategorySortIndex(b.type);
  if (diff !== 0) return diff;
  return (
    new Date(b.outfitCreatedAt).getTime() -
    new Date(a.outfitCreatedAt).getTime()
  );
}
