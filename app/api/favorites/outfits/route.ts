import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toOutfitSummary } from "@/lib/outfit-summary";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const idsParam = request.nextUrl.searchParams.get("ids");

  let ids: string[] = [];

  if (user) {
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id, type: "outfit" },
      orderBy: { createdAt: "desc" },
    });
    ids = favorites.map((f) => f.targetId);
  } else if (idsParam) {
    ids = idsParam.split(",").filter(Boolean);
  }

  if (ids.length === 0) {
    return NextResponse.json({ outfits: [] });
  }

  const outfits = await prisma.outfit.findMany({
    where: { id: { in: ids } },
    include: {
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
  const ordered = ids
    .map((id) => map.get(id))
    .filter((o): o is NonNullable<typeof o> => Boolean(o));

  return NextResponse.json({ outfits: ordered });
}
