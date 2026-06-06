"use client";

import heic2any from "heic2any";

async function tryConvertToJpeg(file: File): Promise<Blob | null> {
  try {
    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.85,
    });
    return Array.isArray(result) ? result[0] : result;
  } catch {
    return null;
  }
}

function isLikelyHeic(file: File): boolean {
  return (
    /^image\/(heic|heif)/i.test(file.type) ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

/** Normalize uploads (e.g. iPhone HEIC disguised as .jpg) for preview and upload. */
export async function prepareImageFile(
  file: File
): Promise<{ file: File; previewUrl: string }> {
  const converted = await tryConvertToJpeg(file);

  if (converted && converted.size > 0) {
    const name = file.name.replace(/\.(heic|heif)$/i, ".jpg");
    const outFile = new File([converted], name, { type: "image/jpeg" });
    return { file: outFile, previewUrl: URL.createObjectURL(outFile) };
  }

  if (isLikelyHeic(file)) {
    throw new Error("HEIC conversion failed");
  }

  return { file, previewUrl: URL.createObjectURL(file) };
}

/** Blob URL suitable for react-easy-crop and canvas cropping. */
export async function prepareImagePreviewUrl(file: File): Promise<string> {
  const { previewUrl } = await prepareImageFile(file);
  return previewUrl;
}
