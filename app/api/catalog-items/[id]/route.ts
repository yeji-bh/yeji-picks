import { NextRequest, NextResponse } from "next/server";
import { syncCatalogImages, toDisplayItem } from "@/lib/catalog-item";
import { isAdminUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { resolveCanonicalBrand } from "@/lib/brand-db";
import { PUBLIC_API_CACHE } from "@/lib/cache-config";
import { prisma } from "@/lib/db";
import { formatOutfitTitle } from "@/lib/outfit";
import { normalizeItemType } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await prisma.catalogItem.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        placements: {
          include: {
            outfit: {
              select: {
                id: true,
                mainImage: true,
                eventName: true,
                date: true,
              },
            },
          },
          orderBy: { outfit: { date: "desc" } },
        },
      },
    });

    if (!item) {
      return apiError(request, "api.errors.notFoundItem", 404);
    }

    const display = toDisplayItem(item);

    return NextResponse.json(
      {
        ...display,
        outfits: item.placements.map((row) => ({
          id: row.outfit.id,
          mainImage: row.outfit.mainImage,
          eventName: row.outfit.eventName,
          title: formatOutfitTitle(row.outfit.date, row.outfit.eventName),
          date: row.outfit.date,
        })),
      },
      { headers: { "Cache-Control": PUBLIC_API_CACHE } }
    );
  } catch (err) {
    console.error("[catalog-item GET]", err);
    return apiError(request, "api.errors.loadFailed", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const existing = await prisma.catalogItem.findUnique({ where: { id } });
    if (!existing) {
      return apiError(request, "api.errors.notFoundItem", 404);
    }

    const type =
      typeof body.type === "string"
        ? normalizeItemType(body.type)
        : normalizeItemType(existing.type);
    const brand =
      typeof body.brand === "string"
        ? (await resolveCanonicalBrand(body.brand)) ?? null
        : existing.brand;
    const productName =
      typeof body.productName === "string"
        ? body.productName.trim() || null
        : existing.productName;
    const officialLink =
      typeof body.officialLink === "string"
        ? body.officialLink.trim() || null
        : existing.officialLink;
    const notes =
      typeof body.notes === "string"
        ? body.notes.trim() || null
        : existing.notes;

    let removedCatalogImages: string[] = [];
    await prisma.$transaction(async (tx) => {
      await tx.catalogItem.update({
        where: { id },
        data: { type, brand, productName, officialLink, notes },
      });

      if (typeof body.image === "string" && body.image) {
        removedCatalogImages = await syncCatalogImages(tx, id, body.image);
      }
    });

    const { cleanupRemovedCatalogImages } = await import("@/lib/delete-upload");
    await cleanupRemovedCatalogImages(removedCatalogImages);

    const updated = await prisma.catalogItem.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(toDisplayItem(updated!));
  } catch {
    return apiError(request, "api.errors.updateFailed", 500);
  }
}
