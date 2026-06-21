import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const perfumes = await prisma.perfume.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      image: true,
      name: true,
      brand: true,
      description: true,
      officialLink: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ perfumes });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const body = await request.json();
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const brand = typeof body.brand === "string" ? body.brand.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const officialLink =
    typeof body.officialLink === "string" ? body.officialLink.trim() : "";

  if (!image || !name || !brand || !officialLink) {
    return apiError(request, "api.errors.invalidParams", 400);
  }

  const row = await prisma.perfume.create({
    data: { image, name, brand, description, officialLink },
    select: {
      id: true,
      image: true,
      name: true,
      brand: true,
      description: true,
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

  await prisma.perfume.delete({ where: { id } });
  await prisma.favorite.deleteMany({ where: { type: "perfume", targetId: id } });

  return NextResponse.json({ ok: true });
}
