import "server-only";

import { prisma } from "@/lib/db";

export async function getOutfitNeighbors(id: string) {
  const current = await prisma.outfit.findUnique({
    where: { id },
    select: { createdAt: true },
  });

  if (!current) {
    return { newerId: null, olderId: null };
  }

  const [newer, older] = await Promise.all([
    prisma.outfit.findFirst({
      where: { createdAt: { gt: current.createdAt } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
    prisma.outfit.findFirst({
      where: { createdAt: { lt: current.createdAt } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
  ]);

  return {
    newerId: newer?.id ?? null,
    olderId: older?.id ?? null,
  };
}
