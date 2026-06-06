/**
 * Remove /uploads files that are no longer referenced in the database.
 *
 * Usage: node --env-file=.env scripts/cleanup-orphan-uploads.mjs
 *        node --env-file=.env scripts/cleanup-orphan-uploads.mjs --dry-run
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
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

function collectFromPayload(data) {
  const urls = new Set();
  if (typeof data.mainImage === "string" && data.mainImage.startsWith("/uploads/")) {
    urls.add(data.mainImage);
  }
  for (const item of data.items ?? []) {
    if (typeof item.image === "string" && item.image.startsWith("/uploads/")) {
      urls.add(item.image);
    }
  }
  return urls;
}

async function referencedUploads() {
  const refs = new Set();

  const [outfits, catalogImages, feedback, submissions] = await Promise.all([
    prisma.outfit.findMany({ select: { mainImage: true } }),
    prisma.catalogItemImage.findMany({ select: { url: true } }),
    prisma.siteFeedback.findMany({ select: { image: true } }),
    prisma.submission.findMany({ select: { rawJson: true } }),
  ]);

  for (const row of outfits) {
    if (row.mainImage?.startsWith("/uploads/")) refs.add(row.mainImage);
  }
  for (const row of catalogImages) {
    if (row.url?.startsWith("/uploads/")) refs.add(row.url);
  }
  for (const row of feedback) {
    if (row.image?.startsWith("/uploads/")) refs.add(row.image);
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

async function main() {
  const refs = await referencedUploads();
  const files = await readdir(UPLOAD_DIR).catch(() => []);

  let removed = 0;
  let kept = 0;

  for (const file of files) {
    const urlPath = `/uploads/${file}`;
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

  console.log(`Done: ${removed} removed, ${kept} kept, ${refs.size} referenced`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
