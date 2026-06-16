import FavoritesContent from "@/components/FavoritesContent";
import type { OutfitSummary } from "@/components/HomeContent";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
    useCount: number;
  }[] = [];
  let initialNailArts: { id: string; image: string }[] = [];
  let initialPhoneCases: {
    id: string;
    image: string;
    brand: string;
    model: string;
    officialLink: string;
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
    const nailArtIds = favorites
      .filter((f) => f.type === "nailArt")
      .map((f) => f.targetId);
    const phoneCaseIds = favorites
      .filter((f) => f.type === "phoneCase")
      .map((f) => f.targetId);

    if (outfitIds.length > 0) {
      const outfits = await prisma.outfit.findMany({
        where: { id: { in: outfitIds } },
        select: {
          id: true,
          mainImage: true,
          eventName: true,
          date: true,
          outfitItems: {
            select: {
              catalogItem: {
                select: {
                  type: true,
                  brand: true,
                  productName: true,
                  notes: true,
                },
              },
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
      const rows = await prisma.catalogItem.findMany({
        where: { id: { in: itemIds } },
        select: {
          id: true,
          type: true,
          brand: true,
          productName: true,
          useCount: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
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
            image: item.images[0]?.url ?? null,
            useCount: item.useCount,
          },
        ])
      );
      initialItems = itemIds.flatMap((id) => {
        const item = map.get(id);
        return item ? [item] : [];
      });
    }

    if (nailArtIds.length > 0) {
      const rows = await prisma.nailArt.findMany({
        where: { id: { in: nailArtIds } },
        select: { id: true, image: true },
      });
      const map = new Map(rows.map((row) => [row.id, row]));
      initialNailArts = nailArtIds.flatMap((id) => {
        const row = map.get(id);
        return row ? [row] : [];
      });
    }

    if (phoneCaseIds.length > 0) {
      const rows = await prisma.phoneCase.findMany({
        where: { id: { in: phoneCaseIds } },
        select: {
          id: true,
          image: true,
          brand: true,
          model: true,
          officialLink: true,
        },
      });
      const map = new Map(rows.map((row) => [row.id, row]));
      initialPhoneCases = phoneCaseIds.flatMap((id) => {
        const row = map.get(id);
        return row ? [row] : [];
      });
    }
  }

  return (
    <FavoritesContent
      initialOutfits={initialOutfits}
      initialItems={initialItems}
      initialNailArts={initialNailArts}
      initialPhoneCases={initialPhoneCases}
    />
  );
}
