import "server-only";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { compressImageBuffer, type ImageKind } from "@/lib/image-compress";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function saveUploadedFile(
  file: File,
  kind: ImageKind = "item"
): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("不支援的圖片格式");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("圖片大小不可超過 10MB");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const raw = Buffer.from(await file.arrayBuffer());
  const compressed = await compressImageBuffer(raw, kind);
  const filename = `${randomUUID()}.webp`;

  await writeFile(path.join(UPLOAD_DIR, filename), compressed);

  return `/uploads/${filename}`;
}
