import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
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
    return NextResponse.json({ error: "無法識別投票者" }, { status: 400 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const vote = body.vote;
    if (vote !== "like" && vote !== "dislike") {
      return NextResponse.json({ error: "無效的投票" }, { status: 400 });
    }

    const dupe = await prisma.catalogDupe.findUnique({
      where: { id },
      select: { catalogItemId: true },
    });
    if (!dupe) {
      return NextResponse.json({ error: "找不到平替" }, { status: 404 });
    }

    const updated = await setDupeVote(id, voterKey, vote as DupeVoteType);
    if (!updated) {
      return NextResponse.json({ error: "找不到平替" }, { status: 404 });
    }

    const dupes = await listCatalogDupes(dupe.catalogItemId, voterKey);
    return NextResponse.json({ dupe: updated, dupes });
  } catch {
    return NextResponse.json({ error: "投票失敗" }, { status: 500 });
  }
}
