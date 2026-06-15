import type { ItemSummary } from "@/lib/item-summary";
import type { Locale } from "@/lib/i18n/settings";
import { compareLocaleFields } from "@/lib/locale-collator";
import {
  OUTFIT_SORT_OPTIONS,
  type OutfitSort,
  typeCategoryRank,
} from "@/lib/outfit-sort";

export const ITEM_SORT_OPTIONS = [
  ...OUTFIT_SORT_OPTIONS,
  "use_count_desc",
] as const;

export type ItemSort = (typeof ITEM_SORT_OPTIONS)[number];
export const DEFAULT_ITEM_SORT: ItemSort = "date_desc";

export function parseItemSort(value: string | null | undefined): ItemSort {
  if (value && (ITEM_SORT_OPTIONS as readonly string[]).includes(value)) {
    return value as ItemSort;
  }
  return DEFAULT_ITEM_SORT;
}

export function itemNameSortFields(item: ItemSummary): string[] {
  return [item.productName ?? "", item.brand ?? "", item.id];
}

export function compareItemsByCategory(
  a: ItemSummary,
  b: ItemSummary,
  locale?: Locale
): number {
  const diff = typeCategoryRank(a.type) - typeCategoryRank(b.type);
  if (diff !== 0) return diff;

  if (locale) {
    const nameDiff = compareLocaleFields(
      locale,
      "asc",
      itemNameSortFields(a),
      itemNameSortFields(b)
    );
    if (nameDiff !== 0) return nameDiff;
  }

  return a.id.localeCompare(b.id);
}

export function compareItemsByName(
  a: ItemSummary,
  b: ItemSummary,
  locale: Locale,
  direction: "asc" | "desc"
): number {
  return compareLocaleFields(
    locale,
    direction,
    itemNameSortFields(a),
    itemNameSortFields(b)
  );
}
