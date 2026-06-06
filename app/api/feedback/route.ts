import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { moderateText } from "@/lib/content-moderation";
import { prisma } from "@/lib/db";
import { saveUploadedFile } from "@/lib/upload";

const FEEDBACK_CATEGORIES = new Set(["suggestion", "same_style"]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const messageRaw = formData.get("message");
    const categoryRaw = formData.get("category");
    const imageFile = formData.get("image");

    if (typeof messageRaw !== "string" || !messageRaw.trim()) {
      return NextResponse.json({ error: "請輸入反饋內容" }, { status: 400 });
    }

    const category =
      typeof categoryRaw === "string" && FEEDBACK_CATEGORIES.has(categoryRaw)
        ? categoryRaw
        : "suggestion";

    const textCheck = moderateText(messageRaw, "反饋內容");
    if (!textCheck.ok) {
      return NextResponse.json({ error: textCheck.error }, { status: 400 });
    }

    let imageUrl: string | null = null;
    if (imageFile instanceof File && imageFile.size > 0) {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "送出失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
