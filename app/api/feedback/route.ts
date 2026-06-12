import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, moderationError } from "@/lib/api-error";
import { moderateText } from "@/lib/content-moderation";
import { prisma } from "@/lib/db";

const FEEDBACK_CATEGORIES = new Set(["suggestion", "same_style"]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const messageRaw = formData.get("message");
    const categoryRaw = formData.get("category");
    const imageFile = formData.get("image");

    if (typeof messageRaw !== "string" || !messageRaw.trim()) {
      return apiError(request, "api.errors.enterFeedback", 400);
    }

    const category =
      typeof categoryRaw === "string" && FEEDBACK_CATEGORIES.has(categoryRaw)
        ? categoryRaw
        : "suggestion";

    const textCheck = moderateText(messageRaw, "feedback");
    if (!textCheck.ok) {
      return moderationError(request, textCheck.field, textCheck.code);
    }

    let imageUrl: string | null = null;
    if (imageFile instanceof File && imageFile.size > 0) {
      const { saveUploadedFile } = await import("@/lib/upload");
      imageUrl = await saveUploadedFile(imageFile, "feedback");
    }

    const user = await getCurrentUser();

    await prisma.siteFeedback.create({
      data: {
        message: messageRaw.trim(),
        category,
        image: imageUrl,
        userId: user?.id ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return apiError(request, "api.errors.submitFailed", 500);
  }
}
