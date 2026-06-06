import FavoritesContent from "@/components/FavoritesContent";
import type { OutfitSummary } from "@/components/HomeContent";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatOutfitTitle } from "@/lib/outfit";
import { toOutfitSummary } from "@/lib/outfit-summary";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  let initialOutfits: OutfitSummary[] = [];
  let initialItems: {
    id: string;
    type: string;
    brand: string | null;
    productName: string | null;
    image: string | null;
    outfitId: string;
    outfitTitle: string;
  }[] = [];

  if (user) {
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const outfitIds = favorites
      .filter((f) => f.type === "outfit")
      .map((f) => f.targetId);
    const itemIds = favorites
      .filter((f) => f.type === "item")
      .map((f) => f.targetId);

    if (outfitIds.length > 0) {
      const outfits = await prisma.outfit.findMany({
        where: { id: { in: outfitIds } },
        select: {
          id: true,
          mainImage: true,
          eventName: true,
          date: true,
          items: {
            select: {
              type: true,
              brand: true,
              productName: true,
              notes: true,
            },
          },
        },
      });
      const map = new Map(outfits.map((o) => [o.id, toOutfitSummary(o)]));
      initialOutfits = outfitIds.flatMap((id) => {
        const o = map.get(id);
        return o ? [o as OutfitSummary] : [];
      });
    }

    if (itemIds.length > 0) {
      const rows = await prisma.item.findMany({
        where: { id: { in: itemIds } },
        select: {
          id: true,
          type: true,
          brand: true,
          productName: true,
          image: true,
          outfitId: true,
          outfit: { select: { date: true, eventName: true } },
        },
      });
      const map = new Map(
        rows.map((item) => [
          item.id,
          {
            id: item.id,
            type: item.type,
            brand: item.brand,
            productName: item.productName,
            image: item.image,
            outfitId: item.outfitId,
            outfitTitle: formatOutfitTitle(
              item.outfit.date,
              item.outfit.eventName
            ),
          },
        ])
      );
      initialItems = itemIds.flatMap((id) => {
        const item = map.get(id);
        return item ? [item] : [];
      });
    }
  }

  return (
    <FavoritesContent
      initialOutfits={initialOutfits}
      initialItems={initialItems}
    />
  );
}
