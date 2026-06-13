/**
 * Add catalog_items.brand_key + index + backfill.
 * Works with file:./local.db or libsql:// Turso.
 * Usage: node --env-file=.env scripts/migrate-brand-key.mjs
 */
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = createClient({
  url,
  authToken: url.startsWith("libsql:") ? authToken : undefined,
});

async function run(sql, label) {
  try {
    const result = await client.execute(sql);
    console.log("OK:", label, result.rowsAffected != null ? `(${result.rowsAffected} rows)` : "");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("duplicate column") || msg.includes("already exists")) {
      console.log("Skip (exists):", label);
    } else {
      console.error("Fail:", label, msg);
      throw err;
    }
  }
}

await run(
  `ALTER TABLE catalog_items ADD COLUMN brand_key TEXT`,
  "add brand_key column"
);
await run(
  `CREATE INDEX IF NOT EXISTS catalog_items_brand_key_idx ON catalog_items(brand_key)`,
  "brand_key index"
);
await run(
  `UPDATE catalog_items
   SET brand_key = LOWER(TRIM(brand))
   WHERE brand IS NOT NULL
     AND TRIM(brand) != ''
     AND (brand_key IS NULL OR brand_key = '')`,
  "backfill brand_key"
);

console.log("brand_key migration complete.");
