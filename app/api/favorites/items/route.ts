import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { primaryImage } from "@/lib/catalog-item";
import { prisma } from "@/lib/db";
import { formatOutfitTitle } from "@/lib/outfit";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const idsParam = request.nextUrl.searchParams.get("ids");

  let ids: string[] = [];

  if (user) {
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id, type: "item" },
      orderBy: { createdAt: "desc" },
    });
    ids = favorites.map((f) => f.targetId);
  } else if (idsParam) {
    ids = idsParam.split(",").filter(Boolean);
  }

  if (ids.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const rows = await prisma.catalogItem.findMany({
    where: { id: { in: ids } },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      placements: {
        take: 1,
        orderBy: { outfit: { createdAt: "desc" } },
        include: { outfit: true },
      },
    },
  });

  const map = new Map(
    rows.map((item) => {
      const outfit = item.placements[0]?.outfit;
      return [
        item.id,
        {
          id: item.id,
          type: item.type,
          brand: item.brand,
          productName: item.productName,
          image: primaryImage(item),
          useCount: item.useCount,
          outfitId: outfit?.id ?? "",
          outfitTitle: outfit
            ? formatOutfitTitle(outfit.date, outfit.eventName)
            : "",
        },
      ];
    })
  );

  const ordered = ids
    .map((id) => map.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return NextResponse.json({ items: ordered });
}
