import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { getOutfitDisplayItems, syncOutfitCatalogItems } from "@/lib/catalog-item";
import { PUBLIC_API_CACHE } from "@/lib/cache-config";
import { prisma } from "@/lib/db";
import { getOutfitNeighborsByCreatedAt } from "@/lib/outfit-nav";
import { revalidateOutfitCaches } from "@/lib/revalidate-outfits";
import { validateSubmissionPayload } from "@/lib/submission";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const outfit = await prisma.outfit.findUnique({ where: { id } });
    if (!outfit) {
      return NextResponse.json({ error: "找不到穿搭" }, { status: 404 });
    }

    const [items, neighbors] = await Promise.all([
      getOutfitDisplayItems(id),
      getOutfitNeighborsByCreatedAt(outfit.createdAt),
    ]);

    return NextResponse.json(
      {
        id: outfit.id,
        eventName: outfit.eventName,
        date: outfit.date,
        mainImage: outfit.mainImage,
        newer: neighbors.newer,
        older: neighbors.older,
        items: items.map((item) => ({
          id: item.id,
          type: item.type,
          brand: item.brand,
          productName: item.productName,
          image: item.image,
          images: item.images,
          officialLink: item.officialLink,
          notes: item.notes,
          linkStatus: item.linkStatus,
          useCount: item.useCount,
        })),
      },
      { headers: { "Cache-Control": PUBLIC_API_CACHE } }
    );
  } catch (err) {
    console.error("[outfit GET]", err);
    return NextResponse.json({ error: "載入失敗" }, { status: 500 });
  }
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
    const payload = validateSubmissionPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "資料格式不正確" }, { status: 400 });
    }

    const outfit = await prisma.outfit.findUnique({ where: { id } });
    if (!outfit) {
      return NextResponse.json({ error: "找不到穿搭" }, { status: 404 });
    }

    const {
      cleanupRemovedCatalogImages,
      cleanupReplacedUploads,
      collectOutfitImages,
      collectPayloadImages,
      deleteOrphanCatalogItems,
    } = await import("@/lib/delete-upload");

    const previousImages = await collectOutfitImages(id);
    const nextImages = collectPayloadImages(payload);

    let removedCatalogImages: string[] = [];
    let orphanCatalogIds: string[] = [];
    await prisma.$transaction(async (tx) => {
      await tx.outfit.update({
        where: { id },
        data: {
          eventName: payload.eventName,
          date: payload.date,
          mainImage: payload.mainImage,
        },
      });

      const syncResult = await syncOutfitCatalogItems(tx, id, payload.items);
      removedCatalogImages = syncResult.removedImageUrls;
      orphanCatalogIds = syncResult.orphanCatalogIds;

      await tx.submission.updateMany({
        where: { outfitId: id },
        data: { rawJson: JSON.stringify(payload) },
      });
    });

    await cleanupReplacedUploads(previousImages, nextImages);
    await cleanupRemovedCatalogImages(removedCatalogImages);
    await deleteOrphanCatalogItems(orphanCatalogIds);

    revalidateOutfitCaches(id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}
