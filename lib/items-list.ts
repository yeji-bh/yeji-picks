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

const itemSelect = {
  id: true,
  type: true,
  brand: true,
  productName: true,
  image: true,
  notes: true,
  outfit: {
    select: {
      id: true,
      eventName: true,
      date: true,
      createdAt: true,
    },
  },
} satisfies Prisma.ItemSelect;

function prismaOrderBy(sort: ItemSort): Prisma.ItemOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { outfit: { createdAt: "asc" } };
    case "date_desc":
      return { outfit: { date: "desc" } };
    case "date_asc":
      return { outfit: { date: "asc" } };
    case "name_asc":
      return { productName: "asc" };
    case "name_desc":
      return { productName: "desc" };
    case "newest":
    default:
      return { outfit: { createdAt: "desc" } };
  }
}

async function queryItemList(
  limit: number,
  offset: number,
  sort: ItemSort = DEFAULT_ITEM_SORT
): Promise<ItemListResult> {
  if (sort === "category") {
    const [rows, total] = await Promise.all([
      prisma.item.findMany({ select: itemSelect }),
      prisma.item.count(),
    ]);
    const sorted = rows.map(toItemSummary).sort(compareItemsByCategory);
    const items = sorted.slice(offset, offset + limit);
    return {
      items,
      total,
      hasMore: offset + items.length < total,
    };
  }

  const [rows, total] = await Promise.all([
    prisma.item.findMany({
      take: limit,
      skip: offset,
      orderBy: prismaOrderBy(sort),
      select: itemSelect,
    }),
    prisma.item.count(),
  ]);

  const items = rows.map(toItemSummary);
  return {
    items,
    total,
    hasMore: offset + items.length < total,
  };
}

const getCachedFirstPage = unstable_cache(
  async () => queryItemList(8, 0, DEFAULT_ITEM_SORT),
  ["items-list-first-page"],
  { revalidate: 60, tags: ["outfits"] }
);

export async function getItemList(
  limit: number,
  offset: number,
  sort?: string | null
): Promise<ItemListResult> {
  const parsedSort = parseItemSort(sort);
  if (limit === 8 && offset === 0 && parsedSort === DEFAULT_ITEM_SORT) {
    return getCachedFirstPage();
  }
  return queryItemList(limit, offset, parsedSort);
}
