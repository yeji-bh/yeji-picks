import "server-only";

import type { DupeSummary, DupeVoteType } from "@/lib/catalog-dupe-types";
import { prisma } from "@/lib/db";

export type { DupeSummary, DupeVoteType } from "@/lib/catalog-dupe-types";

export function dupeScore(likes: number, dislikes: number): number {
  return likes - dislikes * 0.5;
}

function toSummary(
  row: {
    id: string;
    image: string;
    brand: string;
    productName: string | null;
    priceRange: string | null;
    buyLink: string;
    notes: string | null;
    createdAt: Date;
    votes: { vote: string; voterKey: string }[];
  },
  voterKey: string | null
): DupeSummary {
  const likes = row.votes.filter((v) => v.vote === "like").length;
  const dislikes = row.votes.filter((v) => v.vote === "dislike").length;
  const mine = voterKey
    ? row.votes.find((v) => v.voterKey === voterKey)?.vote
    : undefined;

  return {
    id: row.id,
    image: row.image,
    brand: row.brand,
    productName: row.productName,
    priceRange: row.priceRange,
    buyLink: row.buyLink,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    likes,
    dislikes,
    score: dupeScore(likes, dislikes),
    userVote:
      mine === "like" || mine === "dislike" ? (mine as DupeVoteType) : null,
  };
}

export async function listCatalogDupes(
  catalogItemId: string,
  voterKey: string | null
): Promise<DupeSummary[]> {
  const rows = await prisma.catalogDupe.findMany({
    where: { catalogItemId },
    include: { votes: { select: { vote: true, voterKey: true } } },
    orderBy: { createdAt: "desc" },
  });

  return rows
    .map((row) => toSummary(row, voterKey))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export async function setDupeVote(
  dupeId: string,
  voterKey: string,
  vote: DupeVoteType
): Promise<DupeSummary | null> {
  const dupe = await prisma.catalogDupe.findUnique({
    where: { id: dupeId },
    include: { votes: { select: { id: true, vote: true, voterKey: true } } },
  });
  if (!dupe) return null;

  const existing = dupe.votes.find((v) => v.voterKey === voterKey);

  if (!existing) {
    await prisma.dupeVote.create({
      data: { dupeId, voterKey, vote },
    });
  } else if (existing.vote === vote) {
    await prisma.dupeVote.delete({ where: { id: existing.id } });
  } else {
    await prisma.dupeVote.update({
      where: { id: existing.id },
      data: { vote },
    });
  }

  const updated = await prisma.catalogDupe.findUnique({
    where: { id: dupeId },
    include: { votes: { select: { vote: true, voterKey: true } } },
  });
  if (!updated) return null;

  return toSummary(updated, voterKey);
}

export async function deleteCatalogDupe(
  dupeId: string
): Promise<{ catalogItemId: string; image: string } | null> {
  const dupe = await prisma.catalogDupe.findUnique({
    where: { id: dupeId },
    select: { catalogItemId: true, image: true },
  });
  if (!dupe) return null;

  await prisma.catalogDupe.delete({ where: { id: dupeId } });
  return dupe;
}
