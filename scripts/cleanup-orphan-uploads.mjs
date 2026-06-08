/**
 * Remove upload files that are no longer referenced in the database.
 * Uses Cloudflare R2 when configured, otherwise scans public/uploads.
 *
 * Usage: node --env-file=.env scripts/cleanup-orphan-uploads.mjs
 *        node --env-file=.env scripts/cleanup-orphan-uploads.mjs --dry-run
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { readdir, unlink } from "fs/promises";
import path from "path";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const dryRun = process.argv.includes("--dry-run");

if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const adapter = new PrismaLibSQL({ url, authToken: authToken || undefined });
const prisma = new PrismaClient({ adapter });

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const UPLOAD_PREFIX = "/uploads/";

function isR2Configured() {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  );
}

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

function collectFromPayload(data) {
  const urls = new Set();
  if (typeof data.mainImage === "string" && data.mainImage.startsWith(UPLOAD_PREFIX)) {
    urls.add(data.mainImage);
  }
  for (const item of data.items ?? []) {
    if (typeof item.image === "string" && item.image.startsWith(UPLOAD_PREFIX)) {
      urls.add(item.image);
    }
    for (const img of item.images ?? []) {
      if (typeof img === "string" && img.startsWith(UPLOAD_PREFIX)) {
        urls.add(img);
      }
    }
  }
  return urls;
}

async function referencedUploads() {
  const refs = new Set();

  const [outfits, catalogImages, feedback, dupes, submissions] =
    await Promise.all([
      prisma.outfit.findMany({ select: { mainImage: true } }),
      prisma.catalogItemImage.findMany({ select: { url: true } }),
      prisma.siteFeedback.findMany({ select: { image: true } }),
      prisma.catalogDupe.findMany({ select: { image: true } }),
      prisma.submission.findMany({ select: { rawJson: true } }),
    ]);

  for (const row of outfits) {
    if (row.mainImage?.startsWith(UPLOAD_PREFIX)) refs.add(row.mainImage);
  }
  for (const row of catalogImages) {
    if (row.url?.startsWith(UPLOAD_PREFIX)) refs.add(row.url);
  }
  for (const row of feedback) {
    if (row.image?.startsWith(UPLOAD_PREFIX)) refs.add(row.image);
  }
  for (const row of dupes) {
    if (row.image?.startsWith(UPLOAD_PREFIX)) refs.add(row.image);
  }
  for (const row of submissions) {
    try {
      for (const u of collectFromPayload(JSON.parse(row.rawJson))) refs.add(u);
    } catch {
      /* ignore bad json */
    }
  }

  return refs;
}

async function listR2Keys() {
  const client = getR2Client();
  const keys = [];
  let token;

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET,
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

async function deleteR2Key(key) {
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    })
  );
}

async function cleanupR2(refs) {
  const keys = await listR2Keys();
  let removed = 0;
  let kept = 0;

  for (const key of keys) {
    const urlPath = `${UPLOAD_PREFIX}${key}`;
    if (refs.has(urlPath)) {
      kept++;
      continue;
    }
    if (dryRun) {
      console.log(`[dry-run] would delete R2://${key}`);
      removed++;
      continue;
    }
    await deleteR2Key(key);
    console.log(`✓ deleted R2://${key}`);
    removed++;
  }

  return { removed, kept };
}

async function cleanupLocal(refs) {
  const files = await readdir(UPLOAD_DIR).catch(() => []);
  let removed = 0;
  let kept = 0;

  for (const file of files) {
    const urlPath = `${UPLOAD_PREFIX}${file}`;
    if (refs.has(urlPath)) {
      kept++;
      continue;
    }
    if (dryRun) {
      console.log(`[dry-run] would delete ${urlPath}`);
      removed++;
      continue;
    }
    await unlink(path.join(UPLOAD_DIR, file));
    console.log(`✓ deleted ${urlPath}`);
    removed++;
  }

  return { removed, kept };
}

async function main() {
  const refs = await referencedUploads();
  const target = isR2Configured() ? "R2" : "local";
  console.log(`Cleaning orphan uploads (${target})…`);

  const { removed, kept } = isR2Configured()
    ? await cleanupR2(refs)
    : await cleanupLocal(refs);

  console.log(`Done: ${removed} removed, ${kept} kept, ${refs.size} referenced`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
