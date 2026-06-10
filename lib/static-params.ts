import "server-only";

import { brandSlug } from "@/lib/brand";
import { prisma } from "@/lib/db";
import { formatOutfitTitle } from "@/lib/outfit";
import { withIdSlug } from "@/lib/slug";
import { normalizeItemType } from "@/lib/types";

function canQueryBuildDb(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("libsql:");
}

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!canQueryBuildDb()) return fallback;
  try {
    return await fn();
  } catch (err) {
    console.warn("[static-params]", err);
    return fallback;
  }
}

export async function listOutfitStaticParams() {
  return safeQuery(async () => {
    const rows = await prisma.outfit.findMany({
      select: { id: true, date: true, eventName: true },
    });
    return rows.map((row) => ({
      id: withIdSlug(row.id, formatOutfitTitle(row.date, row.eventName)),
    }));
  }, []);
}

export async function listItemStaticParams() {
  return safeQuery(async () => {
    const rows = await prisma.catalogItem.findMany({
      select: {
        id: true,
        brand: true,
        productName: true,
        type: true,
      },
    });
    return rows.map((row) => {
      const label =
        row.productName?.trim() ||
        row.brand?.trim() ||
        normalizeItemType(row.type);
      return { id: withIdSlug(row.id, label) };
    });
  }, []);
}

export async function listBrandStaticParams() {
  return safeQuery(async () => {
    const rows = await prisma.catalogItem.findMany({
      where: { brand: { not: null } },
      select: { brand: true },
      distinct: ["brand"],
    });
    const slugs = new Set<string>();
    for (const row of rows) {
      if (!row.brand?.trim()) continue;
      slugs.add(brandSlug(row.brand));
    }
    return [...slugs].map((slug) => ({ slug }));
  }, []);
}
