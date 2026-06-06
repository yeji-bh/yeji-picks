import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  cleanupReplacedUploads,
  collectOutfitImages,
  collectPayloadImages,
  deleteUploadIfOrphaned,
} from "@/lib/delete-upload";
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

    const previousPayload = JSON.parse(
      submission.rawJson
    ) as SubmissionPayload;
    const nextImages = collectPayloadImages(payload);
    let previousImages: Set<string>;

    if (submission.status === "approved" && submission.outfitId) {
      const outfit = await prisma.outfit.findUnique({
        where: { id: submission.outfitId },
        include: { items: true },
      });
      previousImages = new Set(outfit ? collectOutfitImages(outfit) : []);

      await prisma.$transaction(async (tx) => {
        await tx.outfit.update({
          where: { id: submission.outfitId! },
          data: {
            eventName: payload.eventName,
            date: payload.date,
            mainImage: payload.mainImage,
          },
        });

        await tx.item.deleteMany({ where: { outfitId: submission.outfitId! } });

        if (payload.items.length > 0) {
          await tx.item.createMany({
            data: payload.items.map((item) => ({
              outfitId: submission.outfitId!,
              type: item.type,
              brand: item.brand || null,
              productName: item.productName || null,
              image: item.image || null,
              officialLink: item.officialLink || null,
              notes: item.notes || null,
            })),
          });
        }

        await tx.submission.update({
          where: { id },
          data: { rawJson: JSON.stringify(payload) },
        });
      });

      await cleanupReplacedUploads(previousImages, nextImages);
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

    const outfitId = submission.outfitId;
    const imagesToMaybeDelete: string[] = [];

    if (outfitId) {
      const outfit = await prisma.outfit.findUnique({
        where: { id: outfitId },
        include: { items: true },
      });
      if (outfit) imagesToMaybeDelete.push(...collectOutfitImages(outfit));
    } else {
      imagesToMaybeDelete.push(
        ...collectPayloadImages(JSON.parse(submission.rawJson) as SubmissionPayload)
      );
    }

    await prisma.$transaction(async (tx) => {
      if (outfitId) {
        await tx.outfit.delete({ where: { id: outfitId } });
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
