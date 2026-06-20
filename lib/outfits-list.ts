import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/settings";
import { toOutfitSummary } from "@/lib/outfit-summary";
import {
  compareOutfitsByCategory,
  compareOutfitsByName,
  compareOutfitDates,
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

const outfitSortSelect = {
  id: true,
  eventName: true,
  date: true,
  createdAt: true,
  outfitItems: {
    select: {
      catalogItem: {
        select: { type: true },
      },
    },
  },
} satisfies Prisma.OutfitSelect;

function dbOrderBy(
  sort: OutfitSort
): Prisma.OutfitOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "date_desc":
      return [{ date: "desc" }, { id: "asc" }];
    case "date_asc":
      return [{ date: "asc" }, { id: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }, { id: "asc" }];
    default:
      return [{ createdAt: "desc" }, { id: "asc" }];
  }
}

function toOutfitSortSummary(
  row: Prisma.OutfitGetPayload<{ select: typeof outfitSortSelect }>
): ReturnType<typeof toOutfitSummary> {
  return toOutfitSummary({
    ...row,
    mainImage: "",
    outfitItems: row.outfitItems.map(({ catalogItem }) => ({
      catalogItem: {
        type: catalogItem.type,
        brand: null,
        productName: null,
        notes: null,
      },
    })),
  });
}

function orderRowsByIds<T extends { id: string }>(rows: T[], ids: string[]): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids
    .map((id) => byId.get(id))
    .filter((row): row is T => row != null);
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
  if (sort === "date_desc" || sort === "date_asc") {
    const direction = sort === "date_asc" ? "asc" : "desc";
    return [...outfits].sort((a, b) => {
      const dateDiff = compareOutfitDates(a.date, b.date, direction);
      if (dateDiff !== 0) return dateDiff;
      return a.id.localeCompare(b.id);
    });
  }
  if (sort === "newest" || sort === "oldest") {
    const direction = sort === "oldest" ? "asc" : "desc";
    return [...outfits].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const diff = aTime - bTime;
      if (diff !== 0) return direction === "asc" ? diff : -diff;
      return a.id.localeCompare(b.id);
    });
  }
  return outfits;
}

function needsInMemorySort(sort: OutfitSort): boolean {
  return sort === "category" || sort === "name_asc" || sort === "name_desc";
}

function canUseDbPagination(sort: OutfitSort): boolean {
  return (
    sort === "date_desc" ||
    sort === "date_asc" ||
    sort === "newest" ||
    sort === "oldest"
  );
}

async function queryOutfitListFromDb(
  limit: number,
  offset: number,
  sort: OutfitSort,
  includeTotal: boolean
): Promise<OutfitListResult> {
  const rows = await prisma.outfit.findMany({
    take: limit,
    skip: offset,
    orderBy: dbOrderBy(sort),
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

async function queryOutfitListInMemory(
  limit: number,
  offset: number,
  sort: OutfitSort,
  includeTotal: boolean,
  locale: Locale
): Promise<OutfitListResult> {
  const rows = await prisma.outfit.findMany({ select: outfitSortSelect });
  const sorted = sortOutfitsInMemory(rows.map(toOutfitSortSummary), sort, locale);
  const pageIds = sorted.slice(offset, offset + limit).map((outfit) => outfit.id);

  if (pageIds.length === 0) {
    const total = includeTotal ? sorted.length : 0;
    return { outfits: [], total, hasMore: false };
  }

  const pageRows = await prisma.outfit.findMany({
    where: { id: { in: pageIds } },
    select: outfitSelect,
  });
  const outfits = orderRowsByIds(pageRows, pageIds).map(toOutfitSummary);
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

async function queryOutfitList(
  limit: number,
  offset: number,
  sort: OutfitSort = DEFAULT_OUTFIT_SORT,
  includeTotal = true,
  locale: Locale = DEFAULT_LOCALE
): Promise<OutfitListResult> {
  if (canUseDbPagination(sort)) {
    return queryOutfitListFromDb(limit, offset, sort, includeTotal);
  }

  if (needsInMemorySort(sort)) {
    return queryOutfitListInMemory(limit, offset, sort, includeTotal, locale);
  }

  return queryOutfitListFromDb(limit, offset, "newest", includeTotal);
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
