import "server-only";

import { pickCanonicalBrand } from "@/lib/brand";
import { prisma } from "@/lib/db";
import type { RankingsData } from "@/lib/rankings-types";

export type {
  BrandRankingEntry,
  ItemRankingEntry,
  RankingsData,
} from "@/lib/rankings-types";

export async function getRankingsData(limit = 10): Promise<RankingsData> {
  const rows = await prisma.catalogItem.findMany({
    where: {
      brandKey: { not: null },
      brand: { not: null },
    },
    select: {
      brand: true,
      brandKey: true,
      useCount: true,
    },
  });

  const brandGroups = new Map<
    string,
    { names: string[]; itemCount: number; useCount: number }
  >();

  for (const row of rows) {
    const key = row.brandKey;
    const name = row.brand?.trim();
    if (!key || !name) continue;

    const group = brandGroups.get(key) ?? {
      names: [],
      itemCount: 0,
      useCount: 0,
    };
    group.names.push(name);
    group.itemCount += 1;
    group.useCount += row.useCount;
    brandGroups.set(key, group);
  }

  const topBrands = [...brandGroups.entries()]
    .map(([brandKey, group]) => ({
      brandKey,
      brand: pickCanonicalBrand(group.names),
      itemCount: group.itemCount,
      useCount: group.useCount,
    }))
    .filter((entry) => entry.brand)
    .sort(
      (a, b) =>
        b.itemCount - a.itemCount ||
        b.useCount - a.useCount ||
        a.brand.localeCompare(b.brand)
    )
    .slice(0, limit);

  const itemRows = await prisma.catalogItem.findMany({
    orderBy: [{ useCount: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      type: true,
      brand: true,
      productName: true,
      useCount: true,
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { url: true },
      },
    },
  });

  const topItems = itemRows.map((row) => ({
    id: row.id,
    type: row.type,
    brand: row.brand,
    productName: row.productName,
    image: row.images[0]?.url ?? null,
    useCount: row.useCount,
  }));

  return { topBrands, topItems };
}
