import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import type { ImageKind } from "@/lib/image-compress";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kindRaw = formData.get("kind");

    if (!file || !(file instanceof File)) {
      return apiError(request, "api.errors.selectImage", 400);
    }

    const kind: ImageKind =
      kindRaw === "cover" ? "cover" : kindRaw === "feedback" ? "feedback" : "item";

    const { saveUploadedFile } = await import("@/lib/upload");
    const url = await saveUploadedFile(file, kind);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload POST]", err);
    return apiError(request, "api.errors.operationFailed", 400);
  }
}
