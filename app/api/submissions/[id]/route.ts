import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
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
      return NextResponse.json({ error: "找不到投稿" }, { status: 404 });
    }

    if (!canManageSubmission(submission, user, localIds)) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    return NextResponse.json({
      id: submission.id,
      status: submission.status,
      outfitId: submission.outfitId,
      createdAt: submission.createdAt,
      payload: JSON.parse(submission.rawJson) as SubmissionPayload,
    });
  } catch {
    return NextResponse.json({ error: "載入失敗" }, { status: 500 });
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
      return NextResponse.json({ error: "找不到投稿" }, { status: 404 });
    }

    if (!canManageSubmission(submission, user, localIds)) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    if (submission.status === "approved" && user?.role !== "admin") {
      return NextResponse.json(
        { error: "已通過的投稿請由管理員編輯穿搭" },
        { status: 400 }
      );
    }

    if (
      submission.status !== "pending" &&
      submission.status !== "rejected" &&
      submission.status !== "approved"
    ) {
      return NextResponse.json({ error: "此投稿已無法編輯" }, { status: 400 });
    }

    const body = await request.json();
    const payload = validateSubmissionPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "資料格式不正確" }, { status: 400 });
    }

    const nextStatus =
      submission.status === "rejected" ? "pending" : submission.status;

    const {
      cleanupRemovedCatalogImages,
      cleanupReplacedUploads,
      collectOutfitImages,
      collectPayloadImages,
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
      await prisma.$transaction(async (tx) => {
        await tx.outfit.update({
          where: { id: submission.outfitId! },
          data: {
            eventName: payload.eventName,
            date: payload.date,
            mainImage: payload.mainImage,
          },
        });

        removedCatalogImages = await syncOutfitCatalogItems(
          tx,
          submission.outfitId!,
          payload.items
        );

        await tx.submission.update({
          where: { id },
          data: { rawJson: JSON.stringify(payload) },
        });
      });

      await cleanupReplacedUploads(previousImages, nextImages);
      await cleanupRemovedCatalogImages(removedCatalogImages);
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
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
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
      return NextResponse.json({ error: "找不到投稿" }, { status: 404 });
    }

    if (!canManageSubmission(submission, user, localIds)) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    const {
      collectOutfitImages,
      collectPayloadImages,
      deleteUploadIfOrphaned,
    } = await import("@/lib/delete-upload");

    const outfitId = submission.outfitId;
    const imagesToMaybeDelete: string[] = [];

    if (outfitId) {
      imagesToMaybeDelete.push(...(await collectOutfitImages(outfitId)));
    } else {
      imagesToMaybeDelete.push(
        ...collectPayloadImages(JSON.parse(submission.rawJson) as SubmissionPayload)
      );
    }

    await prisma.$transaction(async (tx) => {
      if (outfitId) {
        const catalogIds = (
          await tx.outfitItem.findMany({
            where: { outfitId },
            select: { catalogItemId: true },
          })
        ).map((row) => row.catalogItemId);
        await tx.outfit.delete({ where: { id: outfitId } });
        await recalcUseCounts(tx, catalogIds);
      }
      await tx.submission.delete({ where: { id } });
    });

    for (const url of imagesToMaybeDelete) {
      await deleteUploadIfOrphaned(url);
    }

    if (outfitId) {
      revalidateOutfitCaches(outfitId);
    } else {
      revalidateOutfitCaches();
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "刪除失敗" }, { status: 500 });
  }
}
