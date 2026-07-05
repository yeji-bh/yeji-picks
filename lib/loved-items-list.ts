import "server-only";

import { prisma } from "@/lib/db";
import {
  getGalleryProductList,
  type GalleryProductSummary,
  DEFAULT_GALLERY_SORT,
} from "@/lib/gallery-product-list";

export type LovedItemSummary = GalleryProductSummary;

export type LovedItemListResult = {
  lovedItems: LovedItemSummary[];
  total: number;
  hasMore: boolean;
};

export async function getLovedItemList(
  limit: number,
  offset: number,
  sort: string | null | undefined,
  withTotal: boolean,
  query = ""
): Promise<LovedItemListResult> {
  const result = await getGalleryProductList(
    prisma.lovedItem,
    limit,
    offset,
    sort,
    withTotal,
    query
  );
  return {
    lovedItems: result.items,
    total: result.total,
    hasMore: result.hasMore,
  };
}

export { DEFAULT_GALLERY_SORT };
