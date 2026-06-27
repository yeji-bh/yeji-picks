/**
 * Migrate legacy accessory types to the accessory_* catalog types.
 * Usage: node --env-file=.env scripts/migrate-accessory-types.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const url = process.env.DATABASE_URL ?? "file:./local.db";
const adapter = new PrismaLibSQL({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const prisma = new PrismaClient({ adapter });

const TYPE_MAP = {
  belt: "accessory_belt",
  socks: "accessory_socks",
  accessory: "accessory_other",
  scarf: "accessory_other",
  other: "accessory_other",
};

const rows = await prisma.catalogItem.findMany({
  where: { type: { in: Object.keys(TYPE_MAP) } },
  select: { id: true, type: true },
});

let updated = 0;
for (const row of rows) {
  const nextType = TYPE_MAP[row.type];
  if (!nextType || row.type === nextType) continue;
  await prisma.catalogItem.update({
    where: { id: row.id },
    data: { type: nextType },
  });
  updated++;
  console.log(`${row.type} → ${nextType} (${row.id})`);
}

console.log(`Migrated ${updated} catalog item(s).`);
await prisma.$disconnect();
