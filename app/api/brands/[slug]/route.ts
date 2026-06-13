import { NextRequest, NextResponse } from "next/server";
import { parseBrandSlug } from "@/lib/brand";
import { getBrandPageData } from "@/lib/brand-db";
import { apiError } from "@/lib/api-error";
import { primaryImage } from "@/lib/catalog-item";
import { PUBLIC_API_CACHE } from "@/lib/cache-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const key = parseBrandSlug(slug);
    if (!key) {
      return apiError(request, "api.errors.invalidParams", 404);
    }

    const data = await getBrandPageData(key);
    if (!data) {
      return apiError(request, "api.errors.invalidParams", 404);
    }

    return NextResponse.json(
      {
        brand: data.displayName,
        items: data.rows.map((item) => ({
          id: item.id,
          type: item.type,
          brand: item.brand,
          productName: item.productName,
          image: primaryImage(item),
          useCount: item.useCount,
        })),
      },
      { headers: { "Cache-Control": PUBLIC_API_CACHE } }
    );
  } catch (err) {
    console.error("[brand GET]", err);
    return apiError(request, "api.errors.loadFailed", 500);
  }
}
