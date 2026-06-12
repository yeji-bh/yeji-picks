import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const { id } = await params;

  try {
    await prisma.report.update({
      where: { id },
      data: { status: "resolved" },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return apiError(request, "api.errors.operationFailed", 500);
  }
}
