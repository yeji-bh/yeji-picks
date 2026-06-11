import "server-only";

import { randomUUID } from "crypto";
import { compressImageBuffer, type ImageKind } from "@/lib/image-compress";
import {
  isObjectStorageConfigured,
  putUploadObject,
} from "@/lib/object-storage";
import { objectKeyToUploadPath } from "@/lib/upload-path";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function writeLocalUpload(filename: string, data: Buffer): Promise<void> {
  const path = await import("path");
  const { mkdir, writeFile } = await import("fs/promises");
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), data);
}

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

  const raw = Buffer.from(await file.arrayBuffer());
  const compressed = await compressImageBuffer(raw, kind);
  const filename = `${randomUUID()}.webp`;

  if (isObjectStorageConfigured()) {
    await putUploadObject(compressed, filename);
  } else {
    await writeLocalUpload(filename, compressed);
  }

  return objectKeyToUploadPath(filename);
}
