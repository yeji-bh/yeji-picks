/**
 * Backfill catalog_items.brand_key for indexed brand pages.
 * Usage: node --env-file=.env scripts/backfill-brand-key.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const url = process.env.DATABASE_URL ?? "file:./local.db";
const adapter = new PrismaLibSQL({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const prisma = new PrismaClient({ adapter });

const rows = await prisma.catalogItem.findMany({
  where: { brand: { not: null } },
  select: { id: true, brand: true, brandKey: true },
});

let updated = 0;
for (const row of rows) {
  const next = row.brand?.trim().toLowerCase() ?? null;
  if (!next || row.brandKey === next) continue;
  await prisma.catalogItem.update({
    where: { id: row.id },
    data: { brandKey: next },
  });
  updated++;
}

console.log(`Backfilled brand_key on ${updated} catalog item(s).`);
await prisma.$disconnect();
