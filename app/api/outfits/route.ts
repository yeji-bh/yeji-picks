import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { normalizeItemType } from "@/lib/types";

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids");

  if (!idsParam) {
    return apiError(request, "api.errors.missingIds", 400);
  }

  const ids = idsParam.split(",").filter(Boolean);
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

  const summaries = outfits.map((outfit) => {
    const catalogItems = outfit.outfitItems.map((row) => row.catalogItem);
    return {
      id: outfit.id,
      mainImage: outfit.mainImage,
      eventName: outfit.eventName,
      date: outfit.date,
      itemTypes: [
        ...new Set(catalogItems.map((item) => normalizeItemType(item.type))),
      ],
      searchText: [
        outfit.eventName,
        outfit.date,
        ...catalogItems.flatMap((item) => [
          item.brand,
          item.productName,
          item.notes,
        ]),
      ]
        .filter(Boolean)
        .join(" "),
    };
  });

  return NextResponse.json({ outfits: summaries });
}
