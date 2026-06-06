import "server-only";

import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toOutfitSummary } from "@/lib/outfit-summary";
import {
  compareOutfitsByCategory,
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
  items: {
    select: {
      type: true,
      brand: true,
      productName: true,
      notes: true,
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

async function queryOutfitList(
  limit: number,
  offset: number,
  sort: OutfitSort = DEFAULT_OUTFIT_SORT
): Promise<OutfitListResult> {
  if (sort === "category") {
    const [rows, total] = await Promise.all([
      prisma.outfit.findMany({ select: outfitSelect }),
      prisma.outfit.count(),
    ]);
    const sorted = rows
      .map(toOutfitSummary)
      .sort(compareOutfitsByCategory);
    const outfits = sorted.slice(offset, offset + limit);
    return {
      outfits,
      total,
      hasMore: offset + outfits.length < total,
    };
  }

  const [rows, total] = await Promise.all([
    prisma.outfit.findMany({
      take: limit,
      skip: offset,
      orderBy: prismaOrderBy(sort),
      select: outfitSelect,
    }),
    prisma.outfit.count(),
  ]);

  const outfits = rows.map(toOutfitSummary);
  return {
    outfits,
    total,
    hasMore: offset + outfits.length < total,
  };
}

const getCachedFirstPage = unstable_cache(
  async () => queryOutfitList(8, 0, DEFAULT_OUTFIT_SORT),
  ["outfits-list-first-page"],
  { revalidate: 60, tags: ["outfits"] }
);

export async function getOutfitList(
  limit: number,
  offset: number,
  sort?: string | null
): Promise<OutfitListResult> {
  const parsedSort = parseOutfitSort(sort);
  if (limit === 8 && offset === 0 && parsedSort === DEFAULT_OUTFIT_SORT) {
    return getCachedFirstPage();
  }
  return queryOutfitList(limit, offset, parsedSort);
}
