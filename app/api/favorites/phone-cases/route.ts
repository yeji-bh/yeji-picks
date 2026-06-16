import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const idsParam = request.nextUrl.searchParams.get("ids");

  let ids: string[] = [];

  if (user) {
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id, type: "phoneCase" },
      orderBy: { createdAt: "desc" },
    });
    ids = favorites.map((f) => f.targetId);
  } else if (idsParam) {
    ids = idsParam.split(",").filter(Boolean);
  }

  if (ids.length === 0) {
    return NextResponse.json({ phoneCases: [] });
  }

  const rows = await prisma.phoneCase.findMany({
    where: { id: { in: ids } },
    select: { id: true, image: true, brand: true, model: true, officialLink: true },
  });

  const map = new Map(rows.map((row) => [row.id, row]));
  const ordered = ids
    .map((id) => map.get(id))
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  return NextResponse.json({ phoneCases: ordered });
}
