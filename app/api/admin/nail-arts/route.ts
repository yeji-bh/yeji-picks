import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";

function parseImages(body: unknown): string[] {
  if (!body || typeof body !== "object") return [];
  const record = body as Record<string, unknown>;
  if (Array.isArray(record.images)) {
    return record.images
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
  }
  if (typeof record.image === "string" && record.image.trim()) {
    return [record.image.trim()];
  }
  return [];
}

export async function GET(request: NextRequest) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const nailArts = await prisma.nailArt.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, image: true, createdAt: true },
  });

  return NextResponse.json({ nailArts });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const body = await request.json();
  const images = parseImages(body);
  if (images.length === 0) {
    return apiError(request, "api.errors.invalidParams", 400);
  }

  const nailArts = await prisma.$transaction(
    images.map((image) =>
      prisma.nailArt.create({
        data: { image },
        select: { id: true, image: true, createdAt: true },
      })
    )
  );

  return NextResponse.json(
    { nailArts, count: nailArts.length },
    { status: 201 }
  );
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return apiError(request, "api.errors.invalidParams", 400);
  }

  await prisma.nailArt.delete({ where: { id } });
  await prisma.favorite.deleteMany({ where: { type: "nailArt", targetId: id } });

  return NextResponse.json({ ok: true });
}
