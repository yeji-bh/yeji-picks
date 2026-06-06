import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.siteFeedback.update({
      where: { id },
      data: { status: "resolved" },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "操作失敗" }, { status: 500 });
  }
}
