import "server-only";

import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import type { SubmissionPayload } from "@/lib/types";

const UPLOAD_PREFIX = "/uploads/";

export function isLocalUpload(url: string | null | undefined): url is string {
  return typeof url === "string" && url.startsWith(UPLOAD_PREFIX);
}

function uploadFilePath(url: string): string {
  return path.join(process.cwd(), "public", url.replace(/^\//, ""));
}

export function collectPayloadImages(payload: {
  mainImage?: string;
  items?: { image?: string | null }[];
}): Set<string> {
  const urls = new Set<string>();
  if (isLocalUpload(payload.mainImage)) urls.add(payload.mainImage);
  for (const item of payload.items ?? []) {
    if (isLocalUpload(item.image)) urls.add(item.image);
  }
  return urls;
}

export function collectOutfitImages(outfit: {
  mainImage: string;
  items: { image: string | null }[];
}): string[] {
  const urls: string[] = [];
  if (isLocalUpload(outfit.mainImage)) urls.push(outfit.mainImage);
  for (const item of outfit.items) {
    if (isLocalUpload(item.image)) urls.push(item.image);
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
  const [outfitCount, itemCount, feedbackCount, submissions] = await Promise.all([
    prisma.outfit.count({ where: { mainImage: url } }),
    prisma.item.count({ where: { image: url } }),
    prisma.siteFeedback.count({ where: { image: url } }),
    prisma.submission.findMany({ select: { rawJson: true } }),
  ]);

  if (outfitCount + itemCount + feedbackCount > 0) return true;
  return submissions.some((row) => imagesInRawJson(row.rawJson).includes(url));
}

export async function deleteUploadIfOrphaned(url: string): Promise<void> {
  if (!isLocalUpload(url)) return;
  if (await isUploadReferenced(url)) return;

  try {
    await unlink(uploadFilePath(url));
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      console.error("[delete-upload] failed:", url, err);
    }
  }
}

/** Delete local uploads that were removed between previous and next image sets. */
export async function cleanupReplacedUploads(
  previousUrls: Iterable<string>,
  nextUrls: Set<string>
): Promise<void> {
  const seen = new Set<string>();
  for (const url of previousUrls) {
    if (!isLocalUpload(url) || nextUrls.has(url) || seen.has(url)) continue;
    seen.add(url);
    await deleteUploadIfOrphaned(url);
  }
}
