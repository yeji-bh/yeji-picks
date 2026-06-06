import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { approveSubmission } from "@/lib/approve-submission";
import { moderateOptionalText, moderateText } from "@/lib/content-moderation";
import { prisma } from "@/lib/db";
import { validateSubmissionPayload } from "@/lib/submission";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = validateSubmissionPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "資料格式不正確" }, { status: 400 });
    }

    if (payload.eventName.trim()) {
      const nameCheck = moderateText(payload.eventName, "活動名稱");
      if (!nameCheck.ok) {
        return NextResponse.json({ error: nameCheck.error }, { status: 400 });
      }
    }

    for (const item of payload.items) {
      for (const [value, field] of [
        [item.brand, "品牌"],
        [item.productName, "商品名稱"],
        [item.notes, "備註"],
      ] as const) {
        const check = moderateOptionalText(value, field);
        if (!check.ok) {
          return NextResponse.json({ error: check.error }, { status: 400 });
        }
      }
    }

    const user = await getCurrentUser();

    const submission = await prisma.submission.create({
      data: {
        status: "pending",
        rawJson: JSON.stringify(payload),
        userId: user?.id ?? null,
      },
    });

    if (user?.role === "admin") {
      const outfit = await approveSubmission(submission.id, user.id);
      return NextResponse.json({
        id: submission.id,
        status: "approved",
        outfitId: outfit.id,
        autoApproved: true,
      });
    }

    return NextResponse.json({ id: submission.id, status: "pending" });
  } catch {
    return NextResponse.json({ error: "送出失敗" }, { status: 500 });
  }
}
