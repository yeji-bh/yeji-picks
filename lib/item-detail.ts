import "server-only";

import { cache } from "react";
import { toDisplayItem } from "@/lib/catalog-item";
import type { OutfitDisplayItem } from "@/lib/catalog-item";
import { prisma } from "@/lib/db";
import { formatOutfitTitle } from "@/lib/outfit";

export type ItemDetailData = {
  item: OutfitDisplayItem;
  outfits: {
    id: string;
    mainImage: string;
    eventName: string;
    date: string;
  }[];
};

export const getItemDetail = cache(
  async (id: string): Promise<ItemDetailData | null> => {
    const item = await prisma.catalogItem.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        placements: {
          include: {
            outfit: {
              select: {
                id: true,
                mainImage: true,
                eventName: true,
                date: true,
              },
            },
          },
          orderBy: { outfit: { date: "desc" } },
        },
      },
    });

    if (!item) return null;

    return {
      item: toDisplayItem(item),
      outfits: item.placements.map((row) => ({
        id: row.outfit.id,
        mainImage: row.outfit.mainImage,
        eventName: row.outfit.eventName,
        date: row.outfit.date,
      })),
    };
  }
);

/** API response shape includes optional title on each outfit row. */
export function itemDetailToApiJson(detail: ItemDetailData) {
  return {
    ...detail.item,
    outfits: detail.outfits.map((row) => ({
      ...row,
      title: formatOutfitTitle(row.date, row.eventName),
    })),
  };
}
