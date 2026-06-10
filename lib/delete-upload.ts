import "server-only";

import path from "path";
import { prisma } from "@/lib/db";
import {
  deleteUploadObject,
  isObjectStorageConfigured,
} from "@/lib/object-storage";
import type { SubmissionPayload } from "@/lib/types";
import { isManagedUpload, UPLOAD_PREFIX } from "@/lib/upload-path";

export { isManagedUpload as isLocalUpload };

function localUploadFilePath(url: string): string {
  return path.join(process.cwd(), "public", url.replace(/^\//, ""));
}

export function collectPayloadImages(payload: {
  mainImage?: string;
  items?: { image?: string | null; images?: string[] | null }[];
}): Set<string> {
  const urls = new Set<string>();
  if (isManagedUpload(payload.mainImage)) urls.add(payload.mainImage);
  for (const item of payload.items ?? []) {
    if (isManagedUpload(item.image)) urls.add(item.image);
    for (const url of item.images ?? []) {
      if (isManagedUpload(url)) urls.add(url);
    }
  }
  return urls;
}

export async function collectOutfitImages(outfitId: string): Promise<string[]> {
  const outfit = await prisma.outfit.findUnique({
    where: { id: outfitId },
    select: {
      mainImage: true,
      outfitItems: {
        select: {
          catalogItem: {
            select: { images: { select: { url: true } } },
          },
        },
      },
    },
  });
  if (!outfit) return [];

  const urls: string[] = [];
  if (isManagedUpload(outfit.mainImage)) urls.push(outfit.mainImage);
  for (const row of outfit.outfitItems) {
    for (const img of row.catalogItem.images) {
      if (isManagedUpload(img.url)) urls.push(img.url);
    }
  }
  return urls;
}

function imagesInRawJson(rawJson: string): string[] {
  try {
    return [...collectPayloadImages(JSON.parse(rawJson) as SubmissionPayload)];
  } catch {
    return [];
  }
}

export async function isUploadReferenced(url: string): Promise<boolean> {
  const [outfitCount, imageCount, feedbackCount, dupeCount, submissions] =
    await Promise.all([
      prisma.outfit.count({ where: { mainImage: url } }),
      prisma.catalogItemImage.count({ where: { url } }),
      prisma.siteFeedback.count({ where: { image: url } }),
      prisma.catalogDupe.count({ where: { image: url } }),
      prisma.submission.findMany({ select: { rawJson: true } }),
    ]);

  if (outfitCount + imageCount + feedbackCount + dupeCount > 0) return true;
  return submissions.some((row) => imagesInRawJson(row.rawJson).includes(url));
}

async function removeUploadFile(url: string): Promise<void> {
  if (isObjectStorageConfigured()) {
    await deleteUploadObject(url);
    return;
  }
  const { unlink } = await import("fs/promises");
  await unlink(localUploadFilePath(url));
}

export async function deleteUploadIfOrphaned(url: string): Promise<void> {
  if (!isManagedUpload(url)) return;
  if (await isUploadReferenced(url)) return;

  try {
    await removeUploadFile(url);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    const status = (err as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;
    if (code === "ENOENT" || status === 404) return;
    console.error("[delete-upload] failed:", url, err);
  }
}

/** Delete uploads that were removed between previous and next image sets. */
export async function cleanupReplacedUploads(
  previousUrls: Iterable<string>,
  nextUrls: Set<string>
): Promise<void> {
  const seen = new Set<string>();
  for (const url of previousUrls) {
    if (!isManagedUpload(url) || nextUrls.has(url) || seen.has(url)) continue;
    seen.add(url);
    await deleteUploadIfOrphaned(url);
  }
}

/** Delete catalog images replaced during item updates. */
export async function cleanupRemovedCatalogImages(
  urls: Iterable<string>
): Promise<void> {
  const seen = new Set<string>();
  for (const url of urls) {
    if (!isManagedUpload(url) || seen.has(url)) continue;
    seen.add(url);
    await deleteUploadIfOrphaned(url);
  }
}

export { UPLOAD_PREFIX };
