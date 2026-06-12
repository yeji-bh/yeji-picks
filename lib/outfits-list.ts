import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/settings";
import { toOutfitSummary } from "@/lib/outfit-summary";
import {
  compareOutfitsByCategory,
  compareOutfitsByName,
  DEFAULT_OUTFIT_SORT,
  type OutfitSort,
  parseOutfitSort,
} from "@/lib/outfit-sort";

export type OutfitListResult = {
  outfits: ReturnType<typeof toOutfitSummary>[];
  total: number;
  hasMore: boolean;
};

const outfitSelect = {
  id: true,
  mainImage: true,
  eventName: true,
  date: true,
  createdAt: true,
  outfitItems: {
    select: {
      catalogItem: {
        select: {
          type: true,
          brand: true,
          productName: true,
          notes: true,
        },
      },
    },
  },
} satisfies Prisma.OutfitSelect;

function prismaOrderBy(sort: OutfitSort): Prisma.OutfitOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "date_desc":
      return { date: "desc" };
    case "date_asc":
      return { date: "asc" };
    case "name_asc":
      return { eventName: "asc" };
    case "name_desc":
      return { eventName: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

function sortOutfitsInMemory(
  outfits: ReturnType<typeof toOutfitSummary>[],
  sort: OutfitSort,
  locale: Locale
): ReturnType<typeof toOutfitSummary>[] {
  if (sort === "category") {
    return [...outfits].sort((a, b) => compareOutfitsByCategory(a, b, locale));
  }
  if (sort === "name_asc" || sort === "name_desc") {
    const direction = sort === "name_asc" ? "asc" : "desc";
    return [...outfits].sort((a, b) =>
      compareOutfitsByName(a, b, locale, direction)
    );
  }
  return outfits;
}

function needsInMemorySort(sort: OutfitSort): boolean {
  return sort === "category" || sort === "name_asc" || sort === "name_desc";
}

async function queryOutfitList(
  limit: number,
  offset: number,
  sort: OutfitSort = DEFAULT_OUTFIT_SORT,
  includeTotal = true,
  locale: Locale = DEFAULT_LOCALE
): Promise<OutfitListResult> {
  if (needsInMemorySort(sort)) {
    const rows = await prisma.outfit.findMany({ select: outfitSelect });
    const sorted = sortOutfitsInMemory(rows.map(toOutfitSummary), sort, locale);
    const outfits = sorted.slice(offset, offset + limit);
    const total = includeTotal
      ? sorted.length
      : offset + outfits.length + (outfits.length === limit ? 1 : 0);
    return {
      outfits,
      total,
      hasMore:
        offset + outfits.length <
        (includeTotal ? total : offset + outfits.length + (outfits.length === limit ? 1 : 0)),
    };
  }

  const rows = await prisma.outfit.findMany({
    take: limit,
    skip: offset,
    orderBy: prismaOrderBy(sort),
    select: outfitSelect,
  });

  const outfits = rows.map(toOutfitSummary);
  if (!includeTotal) {
    return {
      outfits,
      total: offset + outfits.length + (outfits.length === limit ? 1 : 0),
      hasMore: outfits.length === limit,
    };
  }

  const total = await prisma.outfit.count();
  return {
    outfits,
    total,
    hasMore: offset + outfits.length < total,
  };
}

export async function getOutfitList(
  limit: number,
  offset: number,
  sort?: string | null,
  includeTotal = true,
  locale?: string | null
): Promise<OutfitListResult> {
  const parsedSort = parseOutfitSort(sort);
  const parsedLocale = locale && isLocale(locale) ? locale : DEFAULT_LOCALE;
  return queryOutfitList(limit, offset, parsedSort, includeTotal, parsedLocale);
}
