import "server-only";

import type { Prisma } from "@prisma/client";
import { brandKey, pickCanonicalBrand } from "@/lib/brand";
import { prisma } from "@/lib/db";

type DbClient = Prisma.TransactionClient | typeof prisma;

const brandItemInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
} satisfies Prisma.CatalogItemInclude;

export async function resolveCanonicalBrand(
  brand: string | null | undefined,
  db: DbClient = prisma
): Promise<string | null> {
  const trimmed = brand?.trim();
  if (!trimmed) return null;

  const key = brandKey(trimmed);
  const row = await db.catalogItem.findFirst({
    where: { brandKey: key },
    select: { brand: true },
  });
  if (row?.brand?.trim()) {
    return row.brand.trim();
  }

  return trimmed;
}

export async function getBrandPageData(key: string) {
  let rows = await prisma.catalogItem.findMany({
    where: { brandKey: key },
    include: brandItemInclude,
    orderBy: [{ useCount: "desc" }, { createdAt: "desc" }],
  });

  if (rows.length === 0) {
    // Compatibility fallback for legacy rows where brand_key still keeps spaces.
    const matchedIds = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM catalog_items
      WHERE REPLACE(LOWER(TRIM(COALESCE(brand_key, brand, ''))), ' ', '') = ${key}
    `;
    if (matchedIds.length > 0) {
      rows = await prisma.catalogItem.findMany({
        where: { id: { in: matchedIds.map((row) => row.id) } },
        include: brandItemInclude,
        orderBy: [{ useCount: "desc" }, { createdAt: "desc" }],
      });
    }
  }

  if (rows.length === 0) return null;

  const displayName = pickCanonicalBrand(
    rows.map((row) => row.brand).filter((name): name is string => Boolean(name?.trim()))
  );
  if (!displayName) return null;

  return { displayName, rows };
}

/** @deprecated Use getBrandPageData */
export async function findCatalogItemsByBrandKey(key: string) {
  return prisma.catalogItem.findMany({
    where: { brandKey: key },
    include: brandItemInclude,
    orderBy: [{ useCount: "desc" }, { createdAt: "desc" }],
  });
}

/** @deprecated Use getBrandPageData */
export async function getCanonicalBrandName(key: string): Promise<string | null> {
  const data = await getBrandPageData(key);
  return data?.displayName ?? null;
}
