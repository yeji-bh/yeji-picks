import { NextRequest, NextResponse } from "next/server";
import type { ImageKind } from "@/lib/image-compress";
import { saveUploadedFile } from "@/lib/upload";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kindRaw = formData.get("kind");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "請選擇圖片" }, { status: 400 });
    }

    const kind: ImageKind =
      kindRaw === "cover" ? "cover" : kindRaw === "feedback" ? "feedback" : "item";
    const url = await saveUploadedFile(file, kind);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "上傳失敗";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
