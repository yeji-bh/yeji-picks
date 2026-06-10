import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";

export const getCatalogItemRecord = cache((id: string) =>
  prisma.catalogItem.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  })
);

export const getItemOutfitPlacements = cache((catalogItemId: string) =>
  prisma.outfitItem.findMany({
    where: { catalogItemId },
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
  })
);
