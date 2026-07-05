import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";

const select = {
  id: true,
  image: true,
  name: true,
  brand: true,
  officialLink: true,
  createdAt: true,
} as const;

export async function GET(request: NextRequest) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const cosmetics = await prisma.cosmetic.findMany({
    orderBy: { createdAt: "desc" },
    select,
  });

  return NextResponse.json({ cosmetics });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return apiError(request, "api.errors.invalidParams", 400);
  }

  await prisma.cosmetic.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
