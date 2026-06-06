import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncBrowserDataToUser } from "@/lib/browser-sync";
import { prisma } from "@/lib/db";
import type { SubmissionPayload } from "@/lib/types";

function parseIdsParam(request: NextRequest): string[] {
  const raw =
    request.nextUrl.searchParams.get("ids") ??
    request.nextUrl.searchParams.get("localIds");
  return raw?.split(",").filter(Boolean) ?? [];
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const browserIds = parseIdsParam(request);

  if (user) {
    if (browserIds.length > 0) {
      await syncBrowserDataToUser(user.id, browserIds, []);
    }

    const submissions = await prisma.submission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      submissions.map((s) => ({
        id: s.id,
        status: s.status,
        outfitId: s.outfitId,
        createdAt: s.createdAt,
        payload: JSON.parse(s.rawJson) as SubmissionPayload,
      }))
    );
  }

  if (browserIds.length === 0) {
    return NextResponse.json([]);
  }

  const submissions = await prisma.submission.findMany({
    where: { id: { in: browserIds }, userId: null },
    orderBy: { createdAt: "desc" },
  });

  const ordered = browserIds
    .map((id) => submissions.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return NextResponse.json(
    ordered.map((s) => ({
      id: s.id,
      status: s.status,
      outfitId: s.outfitId,
      createdAt: s.createdAt,
      payload: JSON.parse(s.rawJson) as SubmissionPayload,
    }))
  );
}
