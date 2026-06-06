import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { approveSubmission } from "@/lib/approve-submission";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { action } = await request.json();

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "無效操作" }, { status: 400 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json({ error: "找不到投稿" }, { status: 404 });
    }

    if (submission.status !== "pending") {
      return NextResponse.json({ error: "此投稿已處理" }, { status: 400 });
    }

    if (action === "reject") {
      await prisma.submission.update({
        where: { id },
        data: { status: "rejected" },
      });
      return NextResponse.json({ status: "rejected" });
    }

    const outfit = await approveSubmission(id, submission.userId);

    return NextResponse.json({ status: "approved", outfitId: outfit.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "操作失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
