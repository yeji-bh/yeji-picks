import "server-only";

import type {
  OutfitReviewPage,
  OutfitReviewSummary,
} from "@/lib/outfit-review-types";
import { prisma } from "@/lib/db";

export type {
  OutfitReviewPage,
  OutfitReviewSummary,
} from "@/lib/outfit-review-types";

export const REVIEW_PAGE_SIZE = 3;

const MAX_CONTENT = 100;
const MAX_NICKNAME = 32;

type ReviewRow = {
  id: string;
  userId: string | null;
  nickname: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  actorKey: string;
  user: { account: string } | null;
};

function authorInfo(row: {
  userId: string | null;
  nickname: string | null;
  user: { account: string } | null;
}): { authorName: string | null; isAnonymous: boolean } {
  if (row.userId && row.user?.account) {
    return { authorName: row.user.account, isAnonymous: false };
  }
  const nick = row.nickname?.trim();
  if (nick) return { authorName: nick, isAnonymous: false };
  return { authorName: null, isAnonymous: true };
}

function toSummary(
  row: ReviewRow,
  actorKey: string | null,
  isAdmin: boolean
): OutfitReviewSummary {
  const isMine = actorKey != null && row.actorKey === actorKey;
  const canManage = isMine || isAdmin;
  const author = authorInfo(row);

  return {
    id: row.id,
    authorName: author.authorName,
    isAnonymous: author.isAnonymous,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    isMine,
    canEdit: canManage,
    canDelete: canManage,
  };
}

const reviewInclude = { user: { select: { account: true } } } as const;

export async function getOutfitReviewPage(
  outfitId: string,
  actorKey: string | null,
  isAdmin: boolean,
  offset: number,
  limit: number = REVIEW_PAGE_SIZE
): Promise<OutfitReviewPage> {
  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.min(20, Math.max(1, limit));

  const [rows, total, mineRow] = await Promise.all([
    prisma.outfitReview.findMany({
      where: { outfitId },
      include: reviewInclude,
      orderBy: { createdAt: "desc" },
      skip: safeOffset,
      take: safeLimit,
    }),
    prisma.outfitReview.count({ where: { outfitId } }),
    actorKey
      ? prisma.outfitReview.findUnique({
          where: { outfitId_actorKey: { outfitId, actorKey } },
          include: reviewInclude,
        })
      : Promise.resolve(null),
  ]);

  return {
    reviews: rows.map((row) => toSummary(row, actorKey, isAdmin)),
    total,
    hasMore: safeOffset + rows.length < total,
    mine: mineRow ? toSummary(mineRow, actorKey, isAdmin) : null,
  };
}

export function validateReviewInput(body: {
  nickname?: unknown;
  content?: unknown;
}):
  | { ok: true; nickname: string | null; content: string }
  | { ok: false; error: string } {
  const content =
    typeof body.content === "string" ? body.content.trim() : "";
  if (!content) return { ok: false, error: "請輸入評價內容" };
  if (content.length > MAX_CONTENT) {
    return { ok: false, error: `評價內容最多 ${MAX_CONTENT} 字` };
  }

  let nickname: string | null = null;
  if (body.nickname != null && body.nickname !== "") {
    if (typeof body.nickname !== "string") {
      return { ok: false, error: "暱稱格式不正確" };
    }
    nickname = body.nickname.trim();
    if (!nickname) nickname = null;
    else if (nickname.length > MAX_NICKNAME) {
      return { ok: false, error: `暱稱最多 ${MAX_NICKNAME} 字` };
    }
  }

  return { ok: true, nickname, content };
}

export async function createOutfitReview(
  outfitId: string,
  actorKey: string,
  userId: string | null,
  data: { nickname: string | null; content: string }
) {
  return prisma.outfitReview.create({
    data: {
      outfitId,
      actorKey,
      userId,
      nickname: userId ? null : data.nickname,
      content: data.content,
    },
  });
}

export async function updateOutfitReview(
  reviewId: string,
  userId: string | null,
  data: { nickname: string | null; content: string }
) {
  return prisma.outfitReview.update({
    where: { id: reviewId },
    data: {
      nickname: userId ? null : data.nickname,
      content: data.content,
    },
  });
}
