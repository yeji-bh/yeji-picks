import "server-only";

import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toItemSummary } from "@/lib/item-summary";
import {
  compareItemsByCategory,
  DEFAULT_ITEM_SORT,
  type ItemSort,
  parseItemSort,
} from "@/lib/item-sort";

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
    take: 1,
    orderBy: { outfit: { createdAt: "desc" as const } },
    select: {
      outfit: {
        select: { id: true, eventName: true, date: true, createdAt: true },
      },
    },
  },
} satisfies Prisma.CatalogItemSelect;

function prismaOrderBy(sort: ItemSort): Prisma.CatalogItemOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
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

async function queryItemList(
  limit: number,
  offset: number,
  sort: ItemSort = DEFAULT_ITEM_SORT,
  includeTotal = true
): Promise<ItemListResult> {
  if (sort === "category") {
    const rows = await prisma.catalogItem.findMany({ select: catalogSelect });
    const sorted = rows.map(toItemSummary).sort(compareItemsByCategory);
    const items = sorted.slice(offset, offset + limit);
    const total = includeTotal ? sorted.length : offset + items.length + (items.length === limit ? 1 : 0);
    return {
      items,
      total,
      hasMore: offset + items.length < (includeTotal ? total : offset + items.length + (items.length === limit ? 1 : 0)),
    };
  }

  const rows = await prisma.catalogItem.findMany({
    take: limit,
    skip: offset,
    orderBy:
      sort === "newest" || sort === "oldest"
        ? prismaOrderBy(sort)
        : [{ useCount: "desc" }, prismaOrderBy(sort)],
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

const getCachedFirstPage = unstable_cache(
  async () => queryItemList(8, 0, DEFAULT_ITEM_SORT, true),
  ["items-list-first-page"],
  { revalidate: 60, tags: ["outfits"] }
);

export async function getItemList(
  limit: number,
  offset: number,
  sort?: string | null,
  includeTotal = true
): Promise<ItemListResult> {
  const parsedSort = parseItemSort(sort);
  if (includeTotal && limit === 8 && offset === 0 && parsedSort === DEFAULT_ITEM_SORT) {
    return getCachedFirstPage();
  }
  return queryItemList(limit, offset, parsedSort, includeTotal);
}
