import "server-only";

import { randomUUID } from "crypto";
import {
  compressImageBuffer,
  compressThumbBuffer,
  type ImageKind,
} from "@/lib/image-compress";
import { isAllowedUploadMime, resolveUploadMime } from "@/lib/image-mime";
import {
  isObjectStorageConfigured,
  putUploadObject,
} from "@/lib/object-storage";
import { thumbObjectKey } from "@/lib/grid-image-url";
import { objectKeyToUploadPath } from "@/lib/upload-path";
import { isCloudflareWorker } from "@/lib/worker-runtime";

async function writeLocalUpload(filename: string, data: Buffer): Promise<void> {
  const path = await import("path");
  const { mkdir, writeFile } = await import("fs/promises");
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), data);
}

function shouldStoreThumb(kind: ImageKind): boolean {
  return kind === "cover" || kind === "item";
}

async function storeUploadObject(data: Buffer, filename: string): Promise<void> {
  if (isCloudflareWorker()) {
    if (!isObjectStorageConfigured()) {
      throw new Error("R2 storage is not configured on Worker");
    }
    await putUploadObject(data, filename);
  } else if (isObjectStorageConfigured()) {
    await putUploadObject(data, filename);
  } else {
    await writeLocalUpload(filename, data);
  }
}

async function storeThumb(
  kind: ImageKind,
  raw: Buffer,
  filename: string,
  thumbFile?: File | null
): Promise<void> {
  if (!shouldStoreThumb(kind)) return;

  let thumbBuf: Buffer | null = null;
  if (thumbFile && thumbFile.size > 0) {
    thumbBuf = Buffer.from(await thumbFile.arrayBuffer());
  } else if (!isCloudflareWorker()) {
    thumbBuf = await compressThumbBuffer(raw);
  }

  if (!thumbBuf) return;
  await storeUploadObject(thumbBuf, thumbObjectKey(filename));
}

export async function saveUploadedFile(
  file: File,
  kind: ImageKind = "item",
  options?: { thumbFile?: File | null }
): Promise<string> {
  const raw = Buffer.from(await file.arrayBuffer());
  const mime = resolveUploadMime(file.type, raw);

  if (!isAllowedUploadMime(mime)) {
    throw new Error("不支援的圖片格式");
  }

  if (raw.length === 0) {
    throw new Error("不支援的圖片格式");
  }

  if (raw.length > 10 * 1024 * 1024) {
    throw new Error("圖片大小不可超過 10MB");
  }

  const compressed = await compressImageBuffer(raw, kind);
  const filename = `${randomUUID()}.webp`;

  await storeUploadObject(compressed, filename);
  await storeThumb(kind, raw, filename, options?.thumbFile);

  return objectKeyToUploadPath(filename);
}
