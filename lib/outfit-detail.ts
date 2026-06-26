import "server-only";

import { cache } from "react";
import { getOutfitDisplayItems } from "@/lib/catalog-item";
import { prisma } from "@/lib/db";
import { getOutfitNeighborsByCreatedAt } from "@/lib/outfit-nav";

export type OutfitDetailData = {
  id: string;
  eventName: string;
  date: string;
  mainImage: string;
  items: {
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
  }[];
  newer: { id: string; date: string; eventName: string } | null;
  older: { id: string; date: string; eventName: string } | null;
};

export const getOutfitDetail = cache(async (
  id: string
): Promise<OutfitDetailData | null> => {
  const outfit = await prisma.outfit.findUnique({ where: { id } });
  if (!outfit) return null;

  const [items, neighbors] = await Promise.all([
    getOutfitDisplayItems(id),
    getOutfitNeighborsByCreatedAt(outfit.createdAt),
  ]);

  return {
    id: outfit.id,
    eventName: outfit.eventName,
    date: outfit.date,
    mainImage: outfit.mainImage,
    newer: neighbors.newer,
    older: neighbors.older,
    items: items.map((item) => ({
      id: item.id,
      type: item.type,
      brand: item.brand,
      productName: item.productName,
      image: item.image,
      images: item.images,
      officialLink: item.officialLink,
      notes: item.notes,
      linkStatus: item.linkStatus,
      useCount: item.useCount,
    })),
  };
});
