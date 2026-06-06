import "server-only";

import type { Prisma } from "@prisma/client";
import { resolveCanonicalBrand } from "@/lib/brand-db";
import { catalogFingerprint } from "@/lib/catalog-fingerprint";
import { prisma } from "@/lib/db";
import type { SubmissionItem } from "@/lib/types";

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
    type: item.type,
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

function collectImageUrls(item: SubmissionItem): string[] {
  const urls = new Set<string>();
  if (item.image) urls.add(item.image);
  for (const url of item.images ?? []) {
    if (url) urls.add(url);
  }
  return [...urls];
}

async function addImagesIfNew(
  tx: Prisma.TransactionClient,
  catalogItemId: string,
  urls: string[]
) {
  if (urls.length === 0) return;

  const existing = await tx.catalogItemImage.findMany({
    where: { catalogItemId },
    select: { url: true, sortOrder: true },
  });
  const known = new Set(existing.map((row) => row.url));
  let nextOrder =
    existing.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;

  for (const url of urls) {
    if (known.has(url)) continue;
    await tx.catalogItemImage.create({
      data: { catalogItemId, url, sortOrder: nextOrder++ },
    });
    known.add(url);
  }
}

async function resolveCatalogItem(
  tx: Prisma.TransactionClient,
  item: SubmissionItem
): Promise<string> {
  if (item.catalogItemId) {
    const existing = await tx.catalogItem.findUnique({
      where: { id: item.catalogItemId },
    });
    if (!existing) throw new Error("找不到單品主檔");
    await addImagesIfNew(tx, existing.id, collectImageUrls(item));
    return existing.id;
  }

  const canonicalBrand = await resolveCanonicalBrand(item.brand, tx);
  const fingerprint = catalogFingerprint({
    ...item,
    brand: canonicalBrand,
  });

  const productName = item.productName?.trim() || null;
  const candidates = await tx.catalogItem.findMany({
    where: {
      type: item.type,
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
    await addImagesIfNew(tx, matched.id, collectImageUrls(item));
    return matched.id;
  }

  const created = await tx.catalogItem.create({
    data: {
      type: item.type,
      brand: canonicalBrand,
      productName: item.productName?.trim() || null,
      officialLink: item.officialLink?.trim() || null,
      notes: item.notes?.trim() || null,
    },
  });

  await addImagesIfNew(tx, created.id, collectImageUrls(item));
  return created.id;
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

/** Replace all outfit placements from submission items. */
export async function syncOutfitCatalogItems(
  tx: Prisma.TransactionClient,
  outfitId: string,
  items: SubmissionItem[]
) {
  const previous = await tx.outfitItem.findMany({
    where: { outfitId },
    select: { catalogItemId: true },
  });
  const previousIds = previous.map((row) => row.catalogItemId);

  await tx.outfitItem.deleteMany({ where: { outfitId } });

  const nextIds: string[] = [];
  for (const item of items) {
    const catalogItemId = await resolveCatalogItem(tx, item);
    await tx.outfitItem.create({
      data: { outfitId, catalogItemId },
    });
    nextIds.push(catalogItemId);
  }

  await recalcUseCounts(tx, [...previousIds, ...nextIds]);
}

export async function getOutfitDisplayItems(
  outfitId: string
): Promise<OutfitDisplayItem[]> {
  const rows = await prisma.outfitItem.findMany({
    where: { outfitId },
    include: { catalogItem: { include: catalogInclude } },
  });

  return rows.map((row) => toDisplayItem(row.catalogItem));
}

export async function searchCatalogItems(query: string, limit = 12) {
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
