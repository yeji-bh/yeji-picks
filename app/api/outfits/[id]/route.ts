import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { syncOutfitCatalogItems } from "@/lib/catalog-item";
import { PUBLIC_API_CACHE } from "@/lib/cache-config";
import { prisma } from "@/lib/db";
import { getOutfitDetail } from "@/lib/outfit-detail";
import { revalidateOutfitCaches } from "@/lib/revalidate-outfits";
import { validateSubmissionPayload } from "@/lib/submission";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const detail = await getOutfitDetail(id);
    if (!detail) {
      return apiError(request, "api.errors.notFoundOutfit", 404);
    }

    return NextResponse.json(detail, {
      headers: { "Cache-Control": PUBLIC_API_CACHE },
    });
  } catch (err) {
    console.error("[outfit GET]", err);
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
    const payload = validateSubmissionPayload(body);

    if (!payload) {
      return apiError(request, "api.errors.invalidPayload", 400);
    }

    const outfit = await prisma.outfit.findUnique({ where: { id } });
    if (!outfit) {
      return apiError(request, "api.errors.notFoundOutfit", 404);
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
    return apiError(request, "api.errors.updateFailed", 500);
  }
}
