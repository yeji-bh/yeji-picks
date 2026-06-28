import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resolveVoterKey } from "@/lib/dupe-actor";
import { apiError } from "@/lib/api-error";
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
  if (!review) {
    return { ok: false as const, status: 404, errorKey: "api.errors.notFoundReview" };
  }
  if (!isAdmin && (!actorKey || review.actorKey !== actorKey)) {
    return { ok: false as const, status: 403, errorKey: "api.errors.unauthorized" };
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
    return apiError(request, access.errorKey, access.status);
  }
  if (access.review.outfitId !== id) {
    return apiError(request, "api.errors.notFoundReview", 404);
  }

  try {
    const body = await request.json();
    const parsed = validateReviewInput(body);
    if (!parsed.ok) {
      return apiError(request, parsed.errorKey, 400, parsed.params);
    }

    const nickname = user ? null : parsed.nickname;

    await updateOutfitReview(reviewId, user?.id ?? null, {
      nickname,
      content: parsed.content,
    });

    const page = await getOutfitReviewPage(id, actorKey, isAdmin, 0);
    return NextResponse.json({ ok: true, ...page });
  } catch {
    return apiError(request, "api.errors.updateFailed", 500);
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
    return apiError(request, access.errorKey, access.status);
  }
  if (access.review.outfitId !== id) {
    return apiError(request, "api.errors.notFoundReview", 404);
  }

  try {
    await prisma.outfitReview.delete({ where: { id: reviewId } });

    const page = await getOutfitReviewPage(id, actorKey, isAdmin, 0);
    return NextResponse.json({ ok: true, ...page });
  } catch {
    return apiError(request, "api.errors.deleteFailed", 500);
  }
}
