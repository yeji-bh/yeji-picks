import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const phoneCases = await prisma.phoneCase.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      image: true,
      brand: true,
      model: true,
      officialLink: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ phoneCases });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const body = await request.json();
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const brand = typeof body.brand === "string" ? body.brand.trim() : "";
  const model = typeof body.model === "string" ? body.model.trim() : "";
  const officialLink =
    typeof body.officialLink === "string" ? body.officialLink.trim() : "";

  if (!image || !brand || !model || !officialLink) {
    return apiError(request, "api.errors.invalidParams", 400);
  }

  const row = await prisma.phoneCase.create({
    data: { image, brand, model, officialLink },
    select: {
      id: true,
      image: true,
      brand: true,
      model: true,
      officialLink: true,
      createdAt: true,
    },
  });

  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return apiError(request, "api.errors.invalidParams", 400);
  }

  await prisma.phoneCase.delete({ where: { id } });
  await prisma.favorite.deleteMany({ where: { type: "phoneCase", targetId: id } });

  return NextResponse.json({ ok: true });
}
