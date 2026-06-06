import { NextRequest, NextResponse } from "next/server";
import { brandKey, dedupeBrandsByKey } from "@/lib/brand";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) {
    return NextResponse.json({ brands: [] });
  }

  const rows = await prisma.catalogItem.findMany({
    where: {
      brand: { not: null },
    },
    select: { brand: true },
  });

  const key = brandKey(q);
  const brands = dedupeBrandsByKey(
    rows
      .map((row) => row.brand?.trim())
      .filter((name): name is string => Boolean(name))
      .filter((name) => brandKey(name).includes(key))
  ).slice(0, 12);

  return NextResponse.json({ brands });
}
