/**
 * Batch-remove backgrounds from existing item images and save as white-bg WebP.
 *
 * Usage: node --env-file=.env scripts/process-item-backgrounds.mjs
 *        node --env-file=.env scripts/process-item-backgrounds.mjs --dry-run
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { removeBackground } from "@imgly/background-removal-node";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

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

async function itemBackgroundToWhite(buffer) {
  const prepared = await sharp(buffer, { failOn: "error" })
    .rotate()
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  const blob = new Blob([prepared], { type: "image/png" });
  const removed = await removeBackground(blob, {
    model: "small",
    output: { format: "image/png", quality: 0.9 },
  });

  const foreground = Buffer.from(await removed.arrayBuffer());
  const meta = await sharp(foreground).metadata();

  return sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite([{ input: foreground, top: 0, left: 0 }])
    .webp({ quality: 78, effort: 4 })
    .toBuffer();
}

async function main() {
  const images = await prisma.catalogItemImage.findMany({
    select: { url: true },
  });

  const uniquePaths = [...new Set(images.map((i) => i.url).filter(Boolean))];
  console.log(`Found ${uniquePaths.length} unique item images`);

  await mkdir(UPLOAD_DIR, { recursive: true });

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const imagePath of uniquePaths) {
    const filename = path.basename(imagePath);
    const filePath = path.join(UPLOAD_DIR, filename);

    try {
      const raw = await readFile(filePath);
      if (dryRun) {
        console.log(`[dry-run] would process ${filename}`);
        skip++;
        continue;
      }

      const processed = await itemBackgroundToWhite(raw);
      await writeFile(filePath, processed);
      console.log(`✓ ${filename} (${raw.length} → ${processed.length} bytes)`);
      ok++;
    } catch (err) {
      console.error(`✗ ${filename}:`, err instanceof Error ? err.message : err);
      fail++;
    }
  }

  console.log(`Done: ${ok} processed, ${skip} skipped, ${fail} failed`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
