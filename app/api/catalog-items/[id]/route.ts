import { NextRequest, NextResponse } from "next/server";
import { syncCatalogImages, toDisplayItem } from "@/lib/catalog-item";
import { isAdminUser } from "@/lib/auth";
import { resolveCanonicalBrand } from "@/lib/brand-db";
import { prisma } from "@/lib/db";
import { formatOutfitTitle } from "@/lib/outfit";
import { normalizeItemType } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
              createdAt: true,
            },
          },
        },
        orderBy: { outfit: { date: "desc" } },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "找不到單品" }, { status: 404 });
  }

  const display = toDisplayItem(item);

  return NextResponse.json({
    ...display,
    outfits: item.placements.map((row) => ({
      id: row.outfit.id,
      mainImage: row.outfit.mainImage,
      title: formatOutfitTitle(row.outfit.date, row.outfit.eventName),
      date: row.outfit.date,
    })),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const existing = await prisma.catalogItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "找不到單品" }, { status: 404 });
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
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}
