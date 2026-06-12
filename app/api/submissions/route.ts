import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import type { SubmissionPayload } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const ids =
      request.nextUrl.searchParams.get("ids")?.split(",").filter(Boolean) ??
      [];

    if (ids.length === 0) {
      return NextResponse.json([]);
    }

    const submissions = await prisma.submission.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "desc" },
    });

    const ordered = ids
      .map((id) => submissions.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));

    return NextResponse.json(
      ordered.map((s) => ({
        id: s.id,
        status: s.status,
        createdAt: s.createdAt,
        payload: JSON.parse(s.rawJson) as SubmissionPayload,
      }))
    );
  } catch {
    return apiError(request, "api.errors.loadFailed", 500);
  }
}
