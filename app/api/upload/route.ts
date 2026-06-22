import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import type { ImageKind } from "@/lib/image-compress";

function uploadErrorResponse(request: NextRequest, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("[upload POST]", err);

  if (msg.includes("不支援") || msg.includes("unsupported")) {
    return apiError(request, "api.errors.selectImage", 400);
  }
  if (msg.includes("尺寸過小")) {
    return apiError(request, "api.errors.selectImage", 400);
  }
  if (msg.includes("大小不可超過") || msg.includes("10MB")) {
    return apiError(request, "api.errors.selectImage", 400);
  }
  if (msg.includes("not configured")) {
    return apiError(request, "api.errors.storageNotConfigured", 503);
  }
  if (msg.startsWith("R2 ") && msg.includes("failed")) {
    return apiError(request, "api.errors.operationFailed", 502);
  }

  return apiError(request, "api.errors.operationFailed", 400);
}

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
    const thumbRaw = formData.get("thumb");
    const thumbFile =
      thumbRaw instanceof File && thumbRaw.size > 0 ? thumbRaw : undefined;

    const { saveUploadedFile } = await import("@/lib/upload");
    const url = await saveUploadedFile(file, kind, { thumbFile });
    return NextResponse.json({ url });
  } catch (err) {
    return uploadErrorResponse(request, err);
  }
}
