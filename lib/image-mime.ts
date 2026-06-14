const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/** Magic-byte sniff — Workers often receive `application/octet-stream` from FormData. */
export function sniffImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 12) {
    const riff = buffer.toString("ascii", 0, 4);
    const webp = buffer.toString("ascii", 8, 12);
    if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (buffer.length >= 6) {
    const gif = buffer.toString("ascii", 0, 6);
    if (gif === "GIF87a" || gif === "GIF89a") return "image/gif";
  }
  return null;
}

export function resolveUploadMime(
  declaredType: string,
  buffer: Buffer
): string | null {
  if (ALLOWED_IMAGE_TYPES.has(declaredType)) return declaredType;
  if (!declaredType || declaredType === "application/octet-stream") {
    return sniffImageMime(buffer);
  }
  return null;
}

export function isAllowedUploadMime(mime: string | null): mime is string {
  return !!mime && ALLOWED_IMAGE_TYPES.has(mime);
}
