import { NextRequest, NextResponse } from "next/server";
import { searchCatalogItems } from "@/lib/catalog-item";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const items = await searchCatalogItems(q, 12);
  return NextResponse.json({ items });
}
