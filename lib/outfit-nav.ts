import "server-only";

import { prisma } from "@/lib/db";

export type OutfitNeighbor = {
  id: string;
  date: string;
  eventName: string;
};

export async function getOutfitNeighbors(id: string) {
  const current = await prisma.outfit.findUnique({
    where: { id },
    select: { createdAt: true },
  });

  if (!current) {
    return { newer: null, older: null } as {
      newer: OutfitNeighbor | null;
      older: OutfitNeighbor | null;
    };
  }

  return getOutfitNeighborsByCreatedAt(current.createdAt);
}

export async function getOutfitNeighborsByCreatedAt(createdAt: Date) {
  const [newer, older] = await Promise.all([
    prisma.outfit.findFirst({
      where: { createdAt: { gt: createdAt } },
      orderBy: { createdAt: "asc" },
      select: { id: true, date: true, eventName: true },
    }),
    prisma.outfit.findFirst({
      where: { createdAt: { lt: createdAt } },
      orderBy: { createdAt: "desc" },
      select: { id: true, date: true, eventName: true },
    }),
  ]);

  return {
    newer: newer ?? null,
    older: older ?? null,
  };
}
