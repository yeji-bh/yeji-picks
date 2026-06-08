import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { resolveVoterKey } from "@/lib/dupe-actor";
import { moderateText } from "@/lib/content-moderation";
import {
  REVIEW_PAGE_SIZE,
  createOutfitReview,
  getOutfitReviewPage,
  validateReviewInput,
} from "@/lib/outfit-review";
import { prisma } from "@/lib/db";

function parsePageParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0) || 0);
  const limit = Math.min(
    20,
    Math.max(1, Number(searchParams.get("limit") ?? REVIEW_PAGE_SIZE) || REVIEW_PAGE_SIZE)
  );
  return { offset, limit };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const actorKey = resolveVoterKey(request, user?.id);
  const isAdmin = user?.role === "admin";
  const { offset, limit } = parsePageParams(request);

  const outfit = await prisma.outfit.findUnique({ where: { id } });
  if (!outfit) {
    return NextResponse.json({ error: "找不到穿搭" }, { status: 404 });
  }

  const page = await getOutfitReviewPage(id, actorKey, isAdmin, offset, limit);
  return NextResponse.json(page);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const actorKey = resolveVoterKey(request, user?.id);
  if (!actorKey) {
    return NextResponse.json({ error: "無法識別使用者" }, { status: 400 });
  }

  const outfit = await prisma.outfit.findUnique({ where: { id } });
  if (!outfit) {
    return NextResponse.json({ error: "找不到穿搭" }, { status: 404 });
  }

  const existing = await prisma.outfitReview.findUnique({
    where: { outfitId_actorKey: { outfitId: id, actorKey } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "你已評價過此穿搭，請編輯既有評價" },
      { status: 409 }
    );
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

    await createOutfitReview(id, actorKey, user?.id ?? null, {
      nickname,
      content: parsed.content,
    });

    const isAdmin = await isAdminUser();
    const page = await getOutfitReviewPage(id, actorKey, isAdmin, 0);
    return NextResponse.json({ ok: true, ...page });
  } catch {
    return NextResponse.json({ error: "送出失敗" }, { status: 500 });
  }
}
