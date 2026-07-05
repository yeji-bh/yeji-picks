import { NextRequest, NextResponse } from "next/server";
import { searchCatalogItems } from "@/lib/catalog-item";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? 100);
  const limit = Number.isFinite(limitParam)
    ? Math.min(100, Math.max(1, limitParam))
    : 100;
  const items = await searchCatalogItems(q, limit);
  return NextResponse.json({ items });
}
