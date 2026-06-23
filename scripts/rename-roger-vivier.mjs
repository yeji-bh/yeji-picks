/**
 * Normalize ROGERVIVIER → ROGER VIVIER (brandKey stays rogervivier).
 * Usage: node --env-file=.env scripts/rename-roger-vivier.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const url = process.env.DATABASE_URL ?? "file:./local.db";
const adapter = new PrismaLibSQL({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const prisma = new PrismaClient({ adapter });

const TARGET_KEY = "rogervivier";
const CANONICAL = "ROGER VIVIER";

function brandKey(brand) {
  return brand.trim().toLowerCase().replace(/\s+/g, "");
}

const rows = await prisma.catalogItem.findMany({
  where: { brand: { not: null } },
  select: { id: true, brand: true, brandKey: true },
});

let updated = 0;
for (const row of rows) {
  if (brandKey(row.brand) !== TARGET_KEY) continue;
  const nextKey = brandKey(CANONICAL);
  if (row.brand === CANONICAL && row.brandKey === nextKey) continue;
  await prisma.catalogItem.update({
    where: { id: row.id },
    data: { brand: CANONICAL, brandKey: nextKey },
  });
  updated++;
}

console.log(`Updated ${updated} catalog item(s) to "${CANONICAL}".`);
await prisma.$disconnect();
