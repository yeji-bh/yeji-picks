"use client";

import {
  GRID_IMAGE_QUALITY,
  GRID_IMAGE_WIDTH,
  LIST_THUMB_WIDTH,
} from "@/lib/grid-image";

export type ClientImageKind = "cover" | "item" | "feedback";

const OPTIONS: Record<ClientImageKind, { maxEdge: number; quality: number }> =
  {
    cover: { maxEdge: 1200, quality: 0.75 },
    item: { maxEdge: 800, quality: 0.72 },
    feedback: { maxEdge: 640, quality: 0.7 },
  };

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

async function encodeWebp(
  file: File,
  maxEdge: number,
  quality: number
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width < 40 || bitmap.height < 40) {
      throw new Error("圖片尺寸過小");
    }

    const target = fitInside(bitmap.width, bitmap.height, maxEdge);
    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("無法處理圖片");

    ctx.drawImage(bitmap, 0, 0, target.width, target.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result ? resolve(result) : reject(new Error("圖片壓縮失敗")),
        "image/webp",
        quality
      );
    });

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } finally {
    bitmap.close();
  }
}

/** Resize and encode as WebP in the browser before upload (keeps Worker bundle small). */
export async function compressImageForUpload(
  file: File,
  kind: ClientImageKind = "item"
): Promise<File> {
  const { maxEdge, quality } = OPTIONS[kind];
  return encodeWebp(file, maxEdge, quality);
}

/** Grid thumbnail for list / card views (~400px wide). */
export async function compressThumbForUpload(file: File): Promise<File> {
  return encodeWebp(file, GRID_IMAGE_WIDTH, GRID_IMAGE_QUALITY / 100);
}

/** Small list-row thumbnail (perfume, etc.). */
export async function compressListThumbForUpload(file: File): Promise<File> {
  return encodeWebp(file, LIST_THUMB_WIDTH, GRID_IMAGE_QUALITY / 100);
}

export function shouldUploadThumb(kind: ClientImageKind): boolean {
  return kind === "cover" || kind === "item";
}
