import "server-only";

import type { Prisma } from "@prisma/client";
import { brandKey, pickCanonicalBrand } from "@/lib/brand";
import { prisma } from "@/lib/db";

type DbClient = Prisma.TransactionClient | typeof prisma;

async function brandNamesForKey(
  key: string,
  db: DbClient = prisma
): Promise<string[]> {
  const rows = await db.catalogItem.findMany({
    where: { brandKey: key },
    select: { brand: true },
    distinct: ["brand"],
    take: 32,
  });

  return rows
    .map((row) => row.brand?.trim())
    .filter((name): name is string => Boolean(name));
}

export async function resolveCanonicalBrand(
  brand: string | null | undefined,
  db: DbClient = prisma
): Promise<string | null> {
  const trimmed = brand?.trim();
  if (!trimmed) return null;

  const key = brandKey(trimmed);
  const matches = await brandNamesForKey(key, db);
  if (matches.length > 0) {
    return pickCanonicalBrand(matches);
  }

  return trimmed;
}

export async function findCatalogItemsByBrandKey(key: string) {
  return prisma.catalogItem.findMany({
    where: { brandKey: key },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: [{ useCount: "desc" }, { createdAt: "desc" }],
  });
}

export async function getCanonicalBrandName(key: string): Promise<string | null> {
  const matches = await brandNamesForKey(key);
  if (matches.length === 0) return null;
  return pickCanonicalBrand(matches);
}
