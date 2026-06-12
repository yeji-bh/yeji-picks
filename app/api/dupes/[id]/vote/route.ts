import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import {
  listCatalogDupes,
  setDupeVote,
  type DupeVoteType,
} from "@/lib/catalog-dupe";
import { resolveVoterKey } from "@/lib/dupe-actor";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const voterKey = resolveVoterKey(request, user?.id);
  if (!voterKey) {
    return apiError(request, "api.errors.voterUnidentified", 400);
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const vote = body.vote;
    if (vote !== "like" && vote !== "dislike") {
      return apiError(request, "api.errors.invalidVote", 400);
    }

    const dupe = await prisma.catalogDupe.findUnique({
      where: { id },
      select: { catalogItemId: true },
    });
    if (!dupe) {
      return apiError(request, "api.errors.notFoundDupe", 404);
    }

    const updated = await setDupeVote(id, voterKey, vote as DupeVoteType);
    if (!updated) {
      return apiError(request, "api.errors.notFoundDupe", 404);
    }

    const dupes = await listCatalogDupes(dupe.catalogItemId, voterKey);
    return NextResponse.json({ dupe: updated, dupes });
  } catch {
    return apiError(request, "api.errors.voteFailed", 500);
  }
}
