import "server-only";

import { AwsClient } from "aws4fetch";
import {
  objectKeyToUploadPath,
  uploadPathToObjectKey,
} from "@/lib/upload-path";

let aws: AwsClient | null = null;

export function isObjectStorageConfigured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  );
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not configured");
  return bucket;
}

function getAws(): AwsClient {
  if (!isObjectStorageConfigured()) {
    throw new Error("Cloudflare R2 is not configured");
  }
  if (!aws) {
    aws = new AwsClient({
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    });
  }
  return aws;
}

function objectUrl(key: string): string {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const bucket = getBucket();
  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
}

async function r2Fetch(
  key: string,
  init: RequestInit & { method: string }
): Promise<Response> {
  const res = await getAws().fetch(objectUrl(key), init);
  if (res.ok) return res;
  const detail = (await res.text()).slice(0, 300);
  throw new Error(`R2 ${init.method} failed (${res.status}): ${detail}`);
}

export async function putUploadObject(
  buffer: Buffer,
  filename: string
): Promise<void> {
  const key = uploadPathToObjectKey(objectKeyToUploadPath(filename));
  await r2Fetch(key, {
    method: "PUT",
    body: new Uint8Array(buffer),
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=2592000, immutable",
    },
  });
}

export async function deleteUploadObject(uploadPath: string): Promise<void> {
  const key = uploadPathToObjectKey(uploadPath);
  await r2Fetch(key, { method: "DELETE" });
}

export async function uploadObjectExists(key: string): Promise<boolean> {
  try {
    await r2Fetch(key, { method: "HEAD" });
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("(404)")) return false;
    throw err;
  }
}

export async function listUploadObjectKeys(): Promise<string[]> {
  const bucket = getBucket();
  const accountId = process.env.R2_ACCOUNT_ID!;
  const keys: string[] = [];
  let token: string | undefined;

  do {
    const query = new URLSearchParams({ "list-type": "2" });
    if (token) query.set("continuation-token", token);
    const url = `https://${accountId}.r2.cloudflarestorage.com/${bucket}?${query}`;

    const res = await getAws().fetch(url, { method: "GET" });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      throw new Error(`R2 LIST failed (${res.status}): ${detail}`);
    }

    const xml = await res.text();
    for (const match of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) {
      keys.push(match[1]!);
    }
    const truncated = xml.match(/<IsTruncated>(true|false)<\/IsTruncated>/)?.[1];
    token =
      truncated === "true"
        ? xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)?.[1]
        : undefined;
  } while (token);

  return keys;
}
