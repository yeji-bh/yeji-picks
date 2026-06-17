import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ItemSummary } from "@/lib/item-summary";
import { toItemSummary } from "@/lib/item-summary";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/settings";
import {
  compareItemsByCategory,
  compareItemsByName,
  DEFAULT_ITEM_SORT,
  type ItemSort,
  parseItemSort,
} from "@/lib/item-sort";
import {
  compareOutfitDates,
} from "@/lib/outfit-sort";

export type ItemListResult = {
  items: ReturnType<typeof toItemSummary>[];
  total: number;
  hasMore: boolean;
};

const catalogSelect = {
  id: true,
  type: true,
  brand: true,
  productName: true,
  notes: true,
  useCount: true,
  createdAt: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  placements: {
    select: {
      outfit: {
        select: { id: true, eventName: true, date: true, createdAt: true },
      },
    },
  },
} satisfies Prisma.CatalogItemSelect;

function prismaOrderBy(
  sort: ItemSort
): Prisma.CatalogItemOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "use_count_desc":
      return { useCount: "desc" };
    case "date_desc":
      return { placements: { _count: "desc" } };
    case "date_asc":
      return { placements: { _count: "asc" } };
    case "name_asc":
      return { productName: "asc" };
    case "name_desc":
      return { productName: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

function dbOrderBy(
  sort: ItemSort
): Prisma.CatalogItemOrderByWithRelationInput | Prisma.CatalogItemOrderByWithRelationInput[] {
  if (sort === "use_count_desc") {
    return [{ useCount: "desc" }, { createdAt: "desc" }];
  }
  if (sort === "newest" || sort === "oldest") {
    return prismaOrderBy(sort);
  }
  return [{ useCount: "desc" }, prismaOrderBy(sort)];
}

function sortItemsInMemory(
  items: ItemSummary[],
  sort: ItemSort,
  locale: Locale
): ItemSummary[] {
  if (sort === "category") {
    return [...items].sort((a, b) => compareItemsByCategory(a, b, locale));
  }
  if (sort === "name_asc" || sort === "name_desc") {
    const direction = sort === "name_asc" ? "asc" : "desc";
    return [...items].sort((a, b) =>
      compareItemsByName(a, b, locale, direction)
    );
  }
  if (sort === "date_desc" || sort === "date_asc") {
    const direction = sort === "date_asc" ? "asc" : "desc";
    return [...items].sort((a, b) => {
      const dateDiff = compareOutfitDates(
        a.latestOutfitDate,
        b.latestOutfitDate,
        direction
      );
      if (dateDiff !== 0) return dateDiff;
      return b.useCount - a.useCount;
    });
  }
  if (sort === "newest" || sort === "oldest") {
    const direction = sort === "oldest" ? "asc" : "desc";
    return [...items].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const diff = aTime - bTime;
      if (diff !== 0) return direction === "asc" ? diff : -diff;
      return a.id.localeCompare(b.id);
    });
  }
  return items;
}

function needsInMemorySort(sort: ItemSort): boolean {
  return (
    sort === "category" ||
    sort === "name_asc" ||
    sort === "name_desc" ||
    sort === "date_desc" ||
    sort === "date_asc" ||
    sort === "newest" ||
    sort === "oldest"
  );
}

async function queryItemList(
  limit: number,
  offset: number,
  sort: ItemSort = DEFAULT_ITEM_SORT,
  includeTotal = true,
  locale: Locale = DEFAULT_LOCALE
): Promise<ItemListResult> {
  if (needsInMemorySort(sort)) {
    const rows = await prisma.catalogItem.findMany({ select: catalogSelect });
    const sorted = sortItemsInMemory(rows.map(toItemSummary), sort, locale);
    const items = sorted.slice(offset, offset + limit);
    const total = includeTotal
      ? sorted.length
      : offset + items.length + (items.length === limit ? 1 : 0);
    return {
      items,
      total,
      hasMore:
        offset + items.length <
        (includeTotal ? total : offset + items.length + (items.length === limit ? 1 : 0)),
    };
  }

  const rows = await prisma.catalogItem.findMany({
    take: limit,
    skip: offset,
    orderBy: dbOrderBy(sort),
    select: catalogSelect,
  });

  const items = rows.map(toItemSummary);
  if (!includeTotal) {
    return {
      items,
      total: offset + items.length + (items.length === limit ? 1 : 0),
      hasMore: items.length === limit,
    };
  }

  const total = await prisma.catalogItem.count();
  return {
    items,
    total,
    hasMore: offset + items.length < total,
  };
}

export async function getItemList(
  limit: number,
  offset: number,
  sort?: string | null,
  includeTotal = true,
  locale?: string | null
): Promise<ItemListResult> {
  const parsedSort = parseItemSort(sort);
  const parsedLocale = locale && isLocale(locale) ? locale : DEFAULT_LOCALE;
  return queryItemList(limit, offset, parsedSort, includeTotal, parsedLocale);
}
