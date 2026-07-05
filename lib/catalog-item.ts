import "server-only";

import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { brandKeyForStore } from "@/lib/brand";
import { resolveCanonicalBrand } from "@/lib/brand-db";
import { catalogFingerprint } from "@/lib/catalog-fingerprint";
import { prisma } from "@/lib/db";
import { normalizeItemType, type SubmissionItem } from "@/lib/types";

export type CatalogItemWithImages = Prisma.CatalogItemGetPayload<{
  include: { images: true };
}>;

export type OutfitDisplayItem = {
  id: string;
  type: string;
  brand: string | null;
  productName: string | null;
  image: string | null;
  images: string[];
  officialLink: string | null;
  notes: string | null;
  linkStatus: string | null;
  useCount: number;
};

const catalogInclude = { images: { orderBy: { sortOrder: "asc" as const } } };

export function primaryImage(item: CatalogItemWithImages): string | null {
  return item.images[0]?.url ?? null;
}

export function toDisplayItem(item: CatalogItemWithImages): OutfitDisplayItem {
  return {
    id: item.id,
    type: normalizeItemType(item.type),
    brand: item.brand,
    productName: item.productName,
    image: primaryImage(item),
    images: item.images.map((img) => img.url),
    officialLink: item.officialLink,
    notes: item.notes,
    linkStatus: item.linkStatus,
    useCount: item.useCount,
  };
}

function catalogImageUrl(item: SubmissionItem): string | null {
  const primary = item.image?.trim();
  if (primary) return primary;
  const fallback = item.images?.find((url) => url?.trim());
  return fallback?.trim() ?? null;
}

/** Keep a single catalog image; replace when the URL changes. Returns removed URLs. */
export async function syncCatalogImages(
  tx: Prisma.TransactionClient,
  catalogItemId: string,
  url: string
): Promise<string[]> {
  const nextUrl = url.trim();
  if (!nextUrl) return [];

  const existing = await tx.catalogItemImage.findMany({
    where: { catalogItemId },
    select: { url: true },
    orderBy: { sortOrder: "asc" },
  });
  const existingUrls = existing.map((row) => row.url);

  if (existingUrls.length === 1 && existingUrls[0] === nextUrl) {
    return [];
  }

  await tx.catalogItemImage.deleteMany({ where: { catalogItemId } });
  await tx.catalogItemImage.create({
    data: { catalogItemId, url: nextUrl, sortOrder: 0 },
  });

  return existingUrls.filter((oldUrl) => oldUrl !== nextUrl);
}

async function resolveCatalogItem(
  tx: Prisma.TransactionClient,
  item: SubmissionItem
): Promise<{ catalogItemId: string; removedImageUrls: string[] }> {
  const normalizedType = normalizeItemType(item.type);
  const imageUrl = catalogImageUrl(item);
  let removedImageUrls: string[] = [];

  if (item.catalogItemId) {
    const existing = await tx.catalogItem.findUnique({
      where: { id: item.catalogItemId },
    });
    if (!existing) throw new Error("找不到單品主檔");
    if (imageUrl) {
      removedImageUrls = await syncCatalogImages(tx, existing.id, imageUrl);
    }

    const updates: {
      type?: string;
      brand?: string | null;
      brandKey?: string | null;
      productName?: string | null;
      officialLink?: string | null;
      notes?: string | null;
    } = {};

    if (normalizedType !== normalizeItemType(existing.type)) {
      updates.type = normalizedType;
    }
    const brand = (await resolveCanonicalBrand(item.brand, tx)) ?? existing.brand;
    if (item.brand !== undefined && brand !== existing.brand) {
      updates.brand = brand;
      updates.brandKey = brandKeyForStore(brand);
    }
    const productName = item.productName?.trim() || null;
    if (item.productName !== undefined && productName !== existing.productName) {
      updates.productName = productName;
    }
    const officialLink = item.officialLink?.trim() || null;
    if (item.officialLink !== undefined && officialLink !== existing.officialLink) {
      updates.officialLink = officialLink;
    }
    const notes = item.notes?.trim() || null;
    if (item.notes !== undefined && notes !== existing.notes) {
      updates.notes = notes;
    }

    if (Object.keys(updates).length > 0) {
      await tx.catalogItem.update({
        where: { id: existing.id },
        data: updates,
      });
    }

    return { catalogItemId: existing.id, removedImageUrls };
  }

  const canonicalBrand = await resolveCanonicalBrand(item.brand, tx);
  const fingerprint = catalogFingerprint({
    ...item,
    type: normalizedType,
    brand: canonicalBrand,
  });

  const productName = item.productName?.trim() || null;
  const candidates = await tx.catalogItem.findMany({
    where: {
      type: normalizedType,
      ...(productName ? { productName } : {}),
    },
    select: { id: true, type: true, brand: true, productName: true },
  });

  const matched = candidates.find(
    (row) =>
      catalogFingerprint({
        type: row.type,
        brand: row.brand,
        productName: row.productName,
      }) === fingerprint
  );

  if (matched) {
    if (imageUrl) {
      removedImageUrls = await syncCatalogImages(tx, matched.id, imageUrl);
    }
    return { catalogItemId: matched.id, removedImageUrls };
  }

  const created = await tx.catalogItem.create({
    data: {
      type: normalizedType,
      brand: canonicalBrand,
      brandKey: brandKeyForStore(canonicalBrand),
      productName: item.productName?.trim() || null,
      officialLink: item.officialLink?.trim() || null,
      notes: item.notes?.trim() || null,
    },
  });

  if (imageUrl) {
    removedImageUrls = await syncCatalogImages(tx, created.id, imageUrl);
  }
  return { catalogItemId: created.id, removedImageUrls };
}

export async function recalcUseCounts(
  tx: Prisma.TransactionClient,
  catalogItemIds: string[]
) {
  const unique = [...new Set(catalogItemIds)];
  for (const id of unique) {
    const count = await tx.outfitItem.count({ where: { catalogItemId: id } });
    await tx.catalogItem.update({
      where: { id },
      data: { useCount: count },
    });
  }
}

export type SyncOutfitCatalogItemsResult = {
  removedImageUrls: string[];
  orphanCatalogIds: string[];
};

/** Replace all outfit placements from submission items. */
export async function syncOutfitCatalogItems(
  tx: Prisma.TransactionClient,
  outfitId: string,
  items: SubmissionItem[]
): Promise<SyncOutfitCatalogItemsResult> {
  const previous = await tx.outfitItem.findMany({
    where: { outfitId },
    select: { catalogItemId: true },
  });
  const previousIds = previous.map((row) => row.catalogItemId);

  await tx.outfitItem.deleteMany({ where: { outfitId } });

  const nextIds: string[] = [];
  const removedImageUrls: string[] = [];
  for (const item of items) {
    const resolved = await resolveCatalogItem(tx, item);
    await tx.outfitItem.create({
      data: { outfitId, catalogItemId: resolved.catalogItemId },
    });
    nextIds.push(resolved.catalogItemId);
    removedImageUrls.push(...resolved.removedImageUrls);
  }

  await recalcUseCounts(tx, [...previousIds, ...nextIds]);

  const orphanCatalogIds: string[] = [];
  const orphanCandidates = previousIds.filter((id) => !nextIds.includes(id));
  for (const id of orphanCandidates) {
    const row = await tx.catalogItem.findUnique({
      where: { id },
      select: { useCount: true },
    });
    if (row && row.useCount === 0) orphanCatalogIds.push(id);
  }

  return { removedImageUrls, orphanCatalogIds };
}

export const getOutfitDisplayItems = cache(
  async (outfitId: string): Promise<OutfitDisplayItem[]> => {
    const rows = await prisma.outfitItem.findMany({
      where: { outfitId },
      include: { catalogItem: { include: catalogInclude } },
    });

    return rows.map((row) => toDisplayItem(row.catalogItem));
  }
);

export async function searchCatalogItems(query: string, limit = 100) {
  const q = query.trim();
  if (!q) return [];

  const rows = await prisma.catalogItem.findMany({
    where: {
      OR: [
        { brand: { contains: q } },
        { productName: { contains: q } },
        { notes: { contains: q } },
      ],
    },
    include: catalogInclude,
    orderBy: [{ useCount: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return rows.map((row) => ({
    ...toDisplayItem(row),
    searchText: [row.brand, row.productName, row.notes]
      .filter(Boolean)
      .join(" "),
  }));
}
