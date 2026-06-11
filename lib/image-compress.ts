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

/** True only on Cloudflare Workers — not local `next dev` even with a Turso URL. */
function isCloudflareWorker(): boolean {
  return (
    typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair ===
    "function"
  );
}

function fitInside(
  width: number,
  height: number,
  maxEdge: number
): { width: number; height: number } {
  if (width <= maxEdge && height <= maxEdge) {
    return { width, height };
  }
  const scale = Math.min(maxEdge / width, maxEdge / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function isUnsupportedImageError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err);
  return (
    msg.includes("heif") ||
    msg.includes("heic") ||
    msg.includes("bad seek") ||
    msg.includes("unsupported")
  );
}

async function compressWithPhoton(
  buffer: Buffer,
  kind: ImageKind
): Promise<Buffer> {
  const { PhotonImage, SamplingFilter, resize } = await import(
    "@cf-wasm/photon/workerd"
  );
  const { maxEdge } = compressOptions(kind);

  const inputImage = PhotonImage.new_from_byteslice(new Uint8Array(buffer));
  try {
    const width = inputImage.get_width();
    const height = inputImage.get_height();

    if (!width || !height) {
      throw new Error("無法讀取圖片");
    }
    if (width < 40 || height < 40) {
      throw new Error("圖片尺寸過小");
    }

    const target = fitInside(width, height, maxEdge);
    const outputImage =
      target.width === width && target.height === height
        ? inputImage
        : resize(
            inputImage,
            target.width,
            target.height,
            SamplingFilter.Lanczos3
          );

    try {
      const outputBytes = outputImage.get_bytes_webp();
      return Buffer.from(outputBytes);
    } finally {
      if (outputImage !== inputImage) {
        outputImage.free();
      }
    }
  } finally {
    inputImage.free();
  }
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
  try {
    if (isCloudflareWorker()) {
      return await compressWithPhoton(buffer, kind);
    }
    return await compressWithSharp(buffer, kind);
  } catch (err) {
    if (isUnsupportedImageError(err)) {
      throw new Error("不支援的圖片格式，請改用 JPG 或 PNG");
    }
    throw err;
  }
}
