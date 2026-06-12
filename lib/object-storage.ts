import "server-only";

import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  objectKeyToUploadPath,
  uploadPathToObjectKey,
} from "@/lib/upload-path";

let client: S3Client | null = null;

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

function getClient(): S3Client {
  if (!isObjectStorageConfigured()) {
    throw new Error("Cloudflare R2 is not configured");
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

export async function putUploadObject(
  buffer: Buffer,
  filename: string
): Promise<void> {
  const key = uploadPathToObjectKey(objectKeyToUploadPath(filename));
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000",
    })
  );
}

export async function deleteUploadObject(uploadPath: string): Promise<void> {
  const key = uploadPathToObjectKey(uploadPath);
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
  );
}

export async function uploadObjectExists(key: string): Promise<boolean> {
  try {
    await getClient().send(
      new HeadObjectCommand({
        Bucket: getBucket(),
        Key: key,
      })
    );
    return true;
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;
    if (status === 404) return false;
    const code = (err as { name?: string }).name;
    if (code === "NotFound" || code === "NoSuchKey") return false;
    throw err;
  }
}

export async function listUploadObjectKeys(): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;

  do {
    const res = await getClient().send(
      new ListObjectsV2Command({
        Bucket: getBucket(),
        ContinuationToken: token,
      })
    );
    for (const item of res.Contents ?? []) {
      if (item.Key) keys.push(item.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  return keys;
}
