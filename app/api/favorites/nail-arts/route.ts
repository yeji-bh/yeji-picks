import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const idsParam = request.nextUrl.searchParams.get("ids");

  let ids: string[] = [];

  if (user) {
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id, type: "nailArt" },
      orderBy: { createdAt: "desc" },
    });
    ids = favorites.map((f) => f.targetId);
  } else if (idsParam) {
    ids = idsParam.split(",").filter(Boolean);
  }

  if (ids.length === 0) {
    return NextResponse.json({ nailArts: [] });
  }

  const rows = await prisma.nailArt.findMany({
    where: { id: { in: ids } },
    select: { id: true, image: true },
  });

  const map = new Map(rows.map((row) => [row.id, row]));
  const ordered = ids
    .map((id) => map.get(id))
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  return NextResponse.json({ nailArts: ordered });
}
