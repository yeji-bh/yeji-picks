import "server-only";

const COVER_MAX = 1200;
const ITEM_MAX = 800;
const FEEDBACK_MAX = 640;
const COVER_QUALITY = 82;
const ITEM_QUALITY = 78;
const FEEDBACK_QUALITY = 72;

export type ImageKind = "cover" | "item" | "feedback";

function compressOptions(kind: ImageKind): { maxEdge: number; quality: number } {
  if (kind === "cover") return { maxEdge: COVER_MAX, quality: COVER_QUALITY };
  if (kind === "feedback") return { maxEdge: FEEDBACK_MAX, quality: FEEDBACK_QUALITY };
  return { maxEdge: ITEM_MAX, quality: ITEM_QUALITY };
}

import { isCloudflareWorker } from "@/lib/worker-runtime";

function isUnsupportedImageError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err);
  return (
    msg.includes("heif") ||
    msg.includes("heic") ||
    msg.includes("bad seek") ||
    msg.includes("unsupported")
  );
}

async function compressWithSharp(
  buffer: Buffer,
  kind: ImageKind
): Promise<Buffer> {
  const { default: sharp } = await import("sharp");
  const { maxEdge, quality } = compressOptions(kind);

  const image = sharp(buffer, { failOn: "error" }).rotate();
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("無法讀取圖片");
  }
  if (metadata.width < 40 || metadata.height < 40) {
    throw new Error("圖片尺寸過小");
  }

  return image
    .resize(maxEdge, maxEdge, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 })
    .toBuffer();
}

export async function compressImageBuffer(
  buffer: Buffer,
  kind: ImageKind = "item"
): Promise<Buffer> {
  if (isCloudflareWorker()) {
    // Browser compresses to WebP before upload; avoid bundling WASM on Workers.
    return buffer;
  }

  try {
    return await compressWithSharp(buffer, kind);
  } catch (err) {
    if (isUnsupportedImageError(err)) {
      throw new Error("不支援的圖片格式，請改用 JPG 或 PNG");
    }
    throw err;
  }
}
