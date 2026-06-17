import {
  FILTER_TYPES,
  ITEM_TYPE_GROUPS,
  getFilterGroup,
  normalizeItemType,
} from "@/lib/types";
import type { Locale } from "@/lib/i18n/settings";
import { compareLocaleFields } from "@/lib/locale-collator";
import { formatOutfitTitle } from "@/lib/outfit";

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

export function normalizeOutfitDate(date: string): string {
  const digits = date.replace(/\D/g, "");
  return digits.length >= 8 ? digits.slice(0, 8) : digits;
}

export function compareOutfitDates(
  a: string,
  b: string,
  direction: "asc" | "desc"
): number {
  const diff = normalizeOutfitDate(a).localeCompare(normalizeOutfitDate(b));
  return direction === "asc" ? diff : -diff;
}

/** Rank by group order (hat → top → bottom → …) then subtype within group. */
export function typeCategoryRank(type: string): number {
  const normalized = normalizeItemType(type);
  const group = getFilterGroup(normalized);
  const groupIndex = group ? FILTER_TYPES.indexOf(group) : FILTER_TYPES.length;
  if (!group) return groupIndex * 1000 + 999;
  const subtypes = ITEM_TYPE_GROUPS[group] as readonly string[];
  const subtypeIndex = subtypes.indexOf(normalized);
  return groupIndex * 1000 + (subtypeIndex >= 0 ? subtypeIndex : subtypes.length);
}

/** Primary category of an outfit = earliest group among its items (hat before top, etc.). */
export function outfitCategoryRank(itemTypes: string[]): number {
  if (itemTypes.length === 0) return FILTER_TYPES.length * 1000;
  return Math.min(...itemTypes.map(typeCategoryRank));
}

export function categorySortIndex(itemTypes: string[]): number {
  return outfitCategoryRank(itemTypes);
}

export function outfitNameSortFields(outfit: {
  date: string;
  eventName: string;
  id: string;
}): string[] {
  return [
    formatOutfitTitle(outfit.date, outfit.eventName),
    outfit.eventName.trim(),
    outfit.id,
  ];
}

export function compareOutfitsByCategory<
  T extends {
    itemTypes: string[];
    date: string;
    eventName: string;
    id: string;
    createdAt?: Date | string;
  },
>(a: T, b: T, locale?: Locale): number {
  const diff = outfitCategoryRank(a.itemTypes) - outfitCategoryRank(b.itemTypes);
  if (diff !== 0) return diff;

  if (locale) {
    const nameDiff = compareLocaleFields(
      locale,
      "asc",
      outfitNameSortFields(a),
      outfitNameSortFields(b)
    );
    if (nameDiff !== 0) return nameDiff;
  }

  const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return bTime - aTime;
}

export function compareOutfitsByName<
  T extends { date: string; eventName: string; id: string },
>(a: T, b: T, locale: Locale, direction: "asc" | "desc"): number {
  return compareLocaleFields(
    locale,
    direction,
    outfitNameSortFields(a),
    outfitNameSortFields(b)
  );
}
