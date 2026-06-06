import "server-only";

import type { Prisma } from "@prisma/client";
import { brandKey, pickCanonicalBrand } from "@/lib/brand";
import { prisma } from "@/lib/db";

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function resolveCanonicalBrand(
  brand: string | null | undefined,
  db: DbClient = prisma
): Promise<string | null> {
  const trimmed = brand?.trim();
  if (!trimmed) return null;

  const key = brandKey(trimmed);
  const rows = await db.$queryRawUnsafe<{ brand: string }[]>(
    `SELECT brand FROM catalog_items WHERE brand IS NOT NULL AND LOWER(TRIM(brand)) = ?`,
    key
  );

  if (rows.length > 0) {
    return pickCanonicalBrand(rows.map((row) => row.brand));
  }

  return trimmed;
}

export async function findCatalogItemsByBrandKey(key: string) {
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM catalog_items WHERE brand IS NOT NULL AND LOWER(TRIM(brand)) = ?`,
    key
  );

  if (rows.length === 0) return [];

  return prisma.catalogItem.findMany({
    where: { id: { in: rows.map((row) => row.id) } },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: [{ useCount: "desc" }, { createdAt: "desc" }],
  });
}

export async function getCanonicalBrandName(key: string): Promise<string | null> {
  const rows = await prisma.$queryRawUnsafe<{ brand: string }[]>(
    `SELECT brand FROM catalog_items WHERE brand IS NOT NULL AND LOWER(TRIM(brand)) = ?`,
    key
  );
  if (rows.length === 0) return null;
  return pickCanonicalBrand(rows.map((row) => row.brand));
}
