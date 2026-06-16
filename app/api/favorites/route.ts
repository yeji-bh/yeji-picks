import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";

const VALID_TYPES = new Set(["outfit", "item", "nailArt", "phoneCase"]);

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError(request, "api.errors.notLoggedIn", 401);
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    outfitIds: favorites
      .filter((f) => f.type === "outfit")
      .map((f) => f.targetId),
    itemIds: favorites
      .filter((f) => f.type === "item")
      .map((f) => f.targetId),
    nailArtIds: favorites
      .filter((f) => f.type === "nailArt")
      .map((f) => f.targetId),
    phoneCaseIds: favorites
      .filter((f) => f.type === "phoneCase")
      .map((f) => f.targetId),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError(request, "api.errors.notLoggedIn", 401);
  }

  const body = await request.json();
  const type =
    typeof body.type === "string"
      ? body.type
      : body.outfitId
        ? "outfit"
        : body.itemId
          ? "item"
          : null;
  const targetId =
    typeof body.targetId === "string"
      ? body.targetId
      : typeof body.outfitId === "string"
        ? body.outfitId
        : typeof body.itemId === "string"
          ? body.itemId
          : null;

  if (!type || !targetId || !VALID_TYPES.has(type)) {
    return apiError(request, "api.errors.invalidParams", 400);
  }

  if (type === "outfit") {
    const exists = await prisma.outfit.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!exists) {
      return apiError(request, "api.errors.notFoundOutfit", 404);
    }
  } else if (type === "item") {
    const exists = await prisma.catalogItem.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!exists) {
      return apiError(request, "api.errors.notFoundItem", 404);
    }
  } else if (type === "nailArt") {
    const exists = await prisma.nailArt.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!exists) {
      return apiError(request, "api.errors.notFound", 404);
    }
  } else {
    const exists = await prisma.phoneCase.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!exists) {
      return apiError(request, "api.errors.notFound", 404);
    }
  }

  await prisma.favorite.upsert({
    where: {
      userId_type_targetId: { userId: user.id, type, targetId },
    },
    create: { userId: user.id, type, targetId },
    update: {},
  });

  return NextResponse.json({ ok: true, active: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError(request, "api.errors.notLoggedIn", 401);
  }

  const type = request.nextUrl.searchParams.get("type");
  const targetId =
    request.nextUrl.searchParams.get("targetId") ??
    request.nextUrl.searchParams.get("outfitId") ??
    request.nextUrl.searchParams.get("itemId");

  if (!type || !targetId || !VALID_TYPES.has(type)) {
    return apiError(request, "api.errors.invalidParams", 400);
  }

  await prisma.favorite.deleteMany({
    where: { userId: user.id, type, targetId },
  });

  return NextResponse.json({ ok: true, active: false });
}
