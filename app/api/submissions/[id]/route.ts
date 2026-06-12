import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { recalcUseCounts, syncOutfitCatalogItems } from "@/lib/catalog-item";
import { revalidateOutfitCaches } from "@/lib/revalidate-outfits";
import { prisma } from "@/lib/db";
import { validateSubmissionPayload } from "@/lib/submission";
import { canManageSubmission } from "@/lib/submission-access";
import type { SubmissionPayload } from "@/lib/types";

function parseLocalIds(request: NextRequest): string[] {
  const raw =
    request.nextUrl.searchParams.get("ids") ??
    request.nextUrl.searchParams.get("localIds");
  if (!raw) return [];
  return raw.split(",").filter(Boolean);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const localIds = parseLocalIds(request);

  try {
    const submission = await prisma.submission.findUnique({ where: { id } });

    if (!submission) {
      return apiError(request, "api.errors.notFoundSubmission", 404);
    }

    if (!canManageSubmission(submission, user, localIds)) {
      return apiError(request, "api.errors.forbidden", 403);
    }

    return NextResponse.json({
      id: submission.id,
      status: submission.status,
      outfitId: submission.outfitId,
      createdAt: submission.createdAt,
      payload: JSON.parse(submission.rawJson) as SubmissionPayload,
    });
  } catch {
    return apiError(request, "api.errors.loadFailed", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const localIds = parseLocalIds(request);

  try {
    const submission = await prisma.submission.findUnique({ where: { id } });

    if (!submission) {
      return apiError(request, "api.errors.notFoundSubmission", 404);
    }

    if (!canManageSubmission(submission, user, localIds)) {
      return apiError(request, "api.errors.forbidden", 403);
    }

    if (submission.status === "approved" && user?.role !== "admin") {
      return apiError(request, "api.errors.submissionApprovedEdit", 400);
    }

    if (
      submission.status !== "pending" &&
      submission.status !== "rejected" &&
      submission.status !== "approved"
    ) {
      return apiError(request, "api.errors.submissionNotEditable", 400);
    }

    const body = await request.json();
    const payload = validateSubmissionPayload(body);

    if (!payload) {
      return apiError(request, "api.errors.invalidPayload", 400);
    }

    const nextStatus =
      submission.status === "rejected" ? "pending" : submission.status;

    const {
      cleanupRemovedCatalogImages,
      cleanupReplacedUploads,
      collectOutfitImages,
      collectPayloadImages,
      deleteOrphanCatalogItems,
    } = await import("@/lib/delete-upload");

    const previousPayload = JSON.parse(
      submission.rawJson
    ) as SubmissionPayload;
    const nextImages = collectPayloadImages(payload);
    let previousImages: Set<string>;

    if (submission.status === "approved" && submission.outfitId) {
      const previousUrls = await collectOutfitImages(submission.outfitId);
      previousImages = new Set(previousUrls);

      let removedCatalogImages: string[] = [];
      let orphanCatalogIds: string[] = [];
      await prisma.$transaction(async (tx) => {
        await tx.outfit.update({
          where: { id: submission.outfitId! },
          data: {
            eventName: payload.eventName,
            date: payload.date,
            mainImage: payload.mainImage,
          },
        });

        const syncResult = await syncOutfitCatalogItems(
          tx,
          submission.outfitId!,
          payload.items
        );
        removedCatalogImages = syncResult.removedImageUrls;
        orphanCatalogIds = syncResult.orphanCatalogIds;

        await tx.submission.update({
          where: { id },
          data: { rawJson: JSON.stringify(payload) },
        });
      });

      await cleanupReplacedUploads(previousImages, nextImages);
      await cleanupRemovedCatalogImages(removedCatalogImages);
      await deleteOrphanCatalogItems(orphanCatalogIds);
      revalidateOutfitCaches(submission.outfitId);
    } else {
      previousImages = collectPayloadImages(previousPayload);

      await prisma.submission.update({
        where: { id },
        data: {
          rawJson: JSON.stringify(payload),
          status: nextStatus,
        },
      });
      await cleanupReplacedUploads(previousImages, nextImages);
    }

    const updated = await prisma.submission.findUniqueOrThrow({ where: { id } });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      outfitId: updated.outfitId,
      createdAt: updated.createdAt,
      payload,
    });
  } catch {
    return apiError(request, "api.errors.updateFailed", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const localIds = parseLocalIds(request);

  try {
    const submission = await prisma.submission.findUnique({ where: { id } });

    if (!submission) {
      return apiError(request, "api.errors.notFoundSubmission", 404);
    }

    if (!canManageSubmission(submission, user, localIds)) {
      return apiError(request, "api.errors.forbidden", 403);
    }

    const {
      cleanupReplacedUploads,
      collectPayloadImages,
      deleteOrphanCatalogItems,
      purgeUploads,
    } = await import("@/lib/delete-upload");

    const outfitId = submission.outfitId;
    let mainImage: string | null = null;
    let catalogIds: string[] = [];

    if (outfitId) {
      const outfit = await prisma.outfit.findUnique({
        where: { id: outfitId },
        select: { mainImage: true },
      });
      mainImage = outfit?.mainImage ?? null;
      catalogIds = (
        await prisma.outfitItem.findMany({
          where: { outfitId },
          select: { catalogItemId: true },
        })
      ).map((row) => row.catalogItemId);
    }

    const pendingImages = outfitId
      ? null
      : collectPayloadImages(
          JSON.parse(submission.rawJson) as SubmissionPayload
        );

    await prisma.$transaction(async (tx) => {
      if (outfitId) {
        await tx.outfit.delete({ where: { id: outfitId } });
        await recalcUseCounts(tx, catalogIds);
      }
      await tx.submission.delete({ where: { id } });
    });

    if (outfitId) {
      await deleteOrphanCatalogItems(catalogIds);
      if (mainImage) {
        await purgeUploads([mainImage]);
      }
    } else if (pendingImages) {
      await cleanupReplacedUploads(pendingImages, new Set());
    }

    if (outfitId) {
      revalidateOutfitCaches(outfitId);
    } else {
      revalidateOutfitCaches();
    }

    return NextResponse.json({ ok: true });
  } catch {
    return apiError(request, "api.errors.deleteFailed", 500);
  }
}
