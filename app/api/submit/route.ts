import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { approveSubmission } from "@/lib/approve-submission";
import { apiError, moderationError } from "@/lib/api-error";
import { moderateOptionalText, moderateText } from "@/lib/content-moderation";
import { prisma } from "@/lib/db";
import { validateSubmissionPayload } from "@/lib/submission";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = validateSubmissionPayload(body);

    if (!payload) {
      return apiError(request, "api.errors.invalidPayload", 400);
    }

    if (payload.eventName.trim()) {
      const nameCheck = moderateText(payload.eventName, "eventName");
      if (!nameCheck.ok) {
        return moderationError(request, nameCheck.field, nameCheck.code);
      }
    }

    for (const item of payload.items) {
      for (const [value, field] of [
        [item.brand, "brand"],
        [item.productName, "productName"],
        [item.notes, "notes"],
      ] as const) {
        const check = moderateOptionalText(value, field);
        if (!check.ok) {
          return moderationError(request, check.field, check.code);
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
    return apiError(request, "api.errors.submitFailed", 500);
  }
}
