/** Logical upload prefix stored in the database. */
export const UPLOAD_PREFIX = "/uploads/";

export function isManagedUpload(url: string | null | undefined): url is string {
  return typeof url === "string" && url.startsWith(UPLOAD_PREFIX);
}

/** `/uploads/foo.webp` → R2 object key `foo.webp` */
export function uploadPathToObjectKey(path: string): string {
  return path.replace(/^\/uploads\//, "");
}

/** `foo.webp` → `/uploads/foo.webp` */
export function objectKeyToUploadPath(key: string): string {
  return `${UPLOAD_PREFIX}${key.replace(/^\/+/, "")}`;
}
