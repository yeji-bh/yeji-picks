/**
 * Upload local public/uploads files to Cloudflare R2.
 * DB paths stay as /uploads/{filename}.webp — no migration needed.
 *
 * Usage: node --env-file=.env scripts/migrate-uploads-to-r2.mjs
 *        node --env-file=.env scripts/migrate-uploads-to-r2.mjs --dry-run
 */
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { readdir, readFile } from "fs/promises";
import path from "path";

const dryRun = process.argv.includes("--dry-run");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is required`);
    process.exit(1);
  }
  return value;
}

const accountId = requireEnv("R2_ACCOUNT_ID");
const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");
const bucket = requireEnv("R2_BUCKET");

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

async function exists(key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (err) {
    const status = err?.$metadata?.httpStatusCode;
    if (status === 404 || err?.name === "NotFound" || err?.name === "NoSuchKey") {
      return false;
    }
    throw err;
  }
}

async function main() {
  const files = await readdir(UPLOAD_DIR).catch(() => []);
  if (files.length === 0) {
    console.log("No local files in public/uploads");
    return;
  }

  let uploaded = 0;
  let skipped = 0;

  for (const file of files) {
    const key = file;
    if (await exists(key)) {
      console.log(`skip (exists): ${key}`);
      skipped++;
      continue;
    }

    const filePath = path.join(UPLOAD_DIR, file);
    const body = await readFile(filePath);

    if (dryRun) {
      console.log(`[dry-run] would upload ${key} (${body.length} bytes)`);
      uploaded++;
      continue;
    }

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    console.log(`✓ uploaded ${key}`);
    uploaded++;
  }

  console.log(`Done: ${uploaded} uploaded, ${skipped} skipped`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
