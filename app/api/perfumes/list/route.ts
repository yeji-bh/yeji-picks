import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_LIST_CACHE } from "@/lib/cache-config";
import { getPerfumeList } from "@/lib/perfumes-list";

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
  const withTotal = request.nextUrl.searchParams.get("withTotal") !== "0";
  const query = request.nextUrl.searchParams.get("q");
  const data = await getPerfumeList(limit, offset, sort, withTotal, query ?? "");

  return NextResponse.json(data, {
    headers: {
      "Cache-Control":
        limit === 8 && offset === 0
          ? PUBLIC_LIST_CACHE
          : "private, max-age=60, stale-while-revalidate=300",
    },
  });
}
