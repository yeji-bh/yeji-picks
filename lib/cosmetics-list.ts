import "server-only";

import { prisma } from "@/lib/db";
import {
  getGalleryProductList,
  type GalleryProductSummary,
  DEFAULT_GALLERY_SORT,
} from "@/lib/gallery-product-list";

export type CosmeticSummary = GalleryProductSummary;

export type CosmeticListResult = {
  cosmetics: CosmeticSummary[];
  total: number;
  hasMore: boolean;
};

export async function getCosmeticList(
  limit: number,
  offset: number,
  sort: string | null | undefined,
  withTotal: boolean,
  query = ""
): Promise<CosmeticListResult> {
  const result = await getGalleryProductList(
    prisma.cosmetic,
    limit,
    offset,
    sort,
    withTotal,
    query
  );
  return {
    cosmetics: result.items,
    total: result.total,
    hasMore: result.hasMore,
  };
}

export { DEFAULT_GALLERY_SORT };
