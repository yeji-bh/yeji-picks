import { NextRequest, NextResponse } from "next/server";
import { getOutfitList } from "@/lib/outfits-list";

export async function GET(request: NextRequest) {
  const limit = Math.min(
    Math.max(parseInt(request.nextUrl.searchParams.get("limit") || "8", 10), 1),
    200
  );
  const offset = Math.max(
    parseInt(request.nextUrl.searchParams.get("offset") || "0", 10),
    0
  );

  const sort = request.nextUrl.searchParams.get("sort");
  const data = await getOutfitList(limit, offset, sort);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control":
        limit === 8 && offset === 0
          ? "public, s-maxage=60, stale-while-revalidate=120"
          : "private, max-age=30, stale-while-revalidate=60",
    },
  });
}
