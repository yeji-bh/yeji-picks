import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resolveVoterKey } from "@/lib/dupe-actor";
import { moderateText } from "@/lib/content-moderation";
import {
  getOutfitReviewPage,
  updateOutfitReview,
  validateReviewInput,
} from "@/lib/outfit-review";
import { prisma } from "@/lib/db";

async function canManageReview(
  reviewId: string,
  actorKey: string | null,
  isAdmin: boolean
) {
  const review = await prisma.outfitReview.findUnique({
    where: { id: reviewId },
    select: { actorKey: true, outfitId: true },
  });
  if (!review) return { ok: false as const, status: 404, error: "找不到評價" };
  if (!isAdmin && (!actorKey || review.actorKey !== actorKey)) {
    return { ok: false as const, status: 403, error: "未授權" };
  }
  return { ok: true as const, review };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const { id, reviewId } = await params;
  const user = await getCurrentUser();
  const actorKey = resolveVoterKey(request, user?.id);
  const isAdmin = user?.role === "admin";

  const access = await canManageReview(reviewId, actorKey, isAdmin);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if (access.review.outfitId !== id) {
    return NextResponse.json({ error: "找不到評價" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = validateReviewInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const nickname = user ? null : parsed.nickname;
    for (const [label, text] of [
      ["暱稱", nickname],
      ["評價內容", parsed.content],
    ] as const) {
      if (!text) continue;
      const check = moderateText(text, label);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
    }

    await updateOutfitReview(reviewId, user?.id ?? null, {
      nickname,
      content: parsed.content,
    });

    const page = await getOutfitReviewPage(id, actorKey, isAdmin, 0);
    return NextResponse.json({ ok: true, ...page });
  } catch {
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const { id, reviewId } = await params;
  const user = await getCurrentUser();
  const actorKey = resolveVoterKey(request, user?.id);
  const isAdmin = user?.role === "admin";

  const access = await canManageReview(reviewId, actorKey, isAdmin);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if (access.review.outfitId !== id) {
    return NextResponse.json({ error: "找不到評價" }, { status: 404 });
  }

  try {
    await prisma.outfitReview.delete({ where: { id: reviewId } });

    const page = await getOutfitReviewPage(id, actorKey, isAdmin, 0);
    return NextResponse.json({ ok: true, ...page });
  } catch {
    return NextResponse.json({ error: "刪除失敗" }, { status: 500 });
  }
}
