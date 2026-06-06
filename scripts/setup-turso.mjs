import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url?.startsWith("libsql://")) {
  console.error("DATABASE_URL must be a Turso libsql:// URL");
  process.exit(1);
}

if (!authToken) {
  console.error("TURSO_AUTH_TOKEN is required");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function run(sql, label) {
  try {
    await client.execute(sql);
    console.log("OK:", label ?? sql.split("\n")[0]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("duplicate column") ||
      msg.includes("already exists") ||
      msg.includes("UNIQUE constraint failed")
    ) {
      console.log("Skip (exists):", label ?? sql.split("\n")[0]);
    } else {
      console.error("Fail:", label ?? sql.split("\n")[0], msg);
    }
  }
}

async function tableColumns(table) {
  const result = await client.execute(`PRAGMA table_info(${table})`);
  return result.rows.map((r) => r.name);
}

const statements = [
  [`CREATE TABLE IF NOT EXISTS "outfits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "main_image" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`, "outfits"],
  [`CREATE TABLE IF NOT EXISTS "items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outfit_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT,
    "product_name" TEXT,
    "image" TEXT,
    "official_link" TEXT,
    "notes" TEXT,
    "link_status" TEXT,
    "link_checked_at" DATETIME,
    CONSTRAINT "items_outfit_id_fkey" FOREIGN KEY ("outfit_id") REFERENCES "outfits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`, "items (legacy)"],
  [`CREATE TABLE IF NOT EXISTS "catalog_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "brand" TEXT,
    "product_name" TEXT,
    "official_link" TEXT,
    "notes" TEXT,
    "link_status" TEXT,
    "link_checked_at" DATETIME,
    "use_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`, "catalog_items"],
  [`CREATE TABLE IF NOT EXISTS "catalog_item_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "catalog_item_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "catalog_item_images_catalog_item_id_fkey" FOREIGN KEY ("catalog_item_id") REFERENCES "catalog_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`, "catalog_item_images"],
  [`CREATE TABLE IF NOT EXISTS "outfit_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outfit_id" TEXT NOT NULL,
    "catalog_item_id" TEXT NOT NULL,
    CONSTRAINT "outfit_items_outfit_id_fkey" FOREIGN KEY ("outfit_id") REFERENCES "outfits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "outfit_items_catalog_item_id_fkey" FOREIGN KEY ("catalog_item_id") REFERENCES "catalog_items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`, "outfit_items"],
  [`CREATE UNIQUE INDEX IF NOT EXISTS "outfit_items_outfit_catalog_key" ON "outfit_items"("outfit_id", "catalog_item_id")`, "outfit_items_unique"],
  [`CREATE TABLE IF NOT EXISTS "submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "raw_json" TEXT NOT NULL,
    "outfit_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`, "submissions"],
  [`CREATE TABLE IF NOT EXISTS "reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outfit_id" TEXT NOT NULL,
    "item_id" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reports_outfit_id_fkey" FOREIGN KEY ("outfit_id") REFERENCES "outfits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`, "reports"],
  [`CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "account" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`, "users"],
  [`CREATE UNIQUE INDEX IF NOT EXISTS "users_account_key" ON "users"("account")`, "users_account_key"],
  [`CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`, "sessions"],
  [`CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_key" ON "sessions"("token")`, "sessions_token_key"],
  [`CREATE TABLE IF NOT EXISTS "favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`, "favorites"],
  [`CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_type_target_key" ON "favorites"("user_id", "type", "target_id")`, "favorites_unique"],
  [`CREATE TABLE IF NOT EXISTS "site_feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`, "site_feedback"],
];

for (const [sql, label] of statements) {
  await run(sql, label);
}

// users: email → username → account
const userCols = await tableColumns("users");
if (userCols.includes("email") && !userCols.includes("account")) {
  if (!userCols.includes("username")) {
    await run(`ALTER TABLE users ADD COLUMN username TEXT`, "add username");
    await run(`UPDATE users SET username = email WHERE username IS NULL`, "email→username");
  }
}
userCols.length = 0;
const userCols2 = await tableColumns("users");
if (
  (userCols2.includes("username") || userCols2.includes("email")) &&
  !userCols2.includes("account")
) {
  await run(`ALTER TABLE users ADD COLUMN account TEXT`, "add account");
  if (userCols2.includes("username")) {
    await run(`UPDATE users SET account = username WHERE account IS NULL`, "username→account");
  } else {
    await run(`UPDATE users SET account = email WHERE account IS NULL`, "email→account");
  }
  await run(
    `CREATE UNIQUE INDEX IF NOT EXISTS "users_account_key" ON "users"("account")`,
    "users_account_key"
  );
  console.log("Migrated users → account");
}

// outfits: remove idol_name dependency by recreating table
const outfitCols = await tableColumns("outfits");
if (outfitCols.includes("idol_name")) {
  await run(`CREATE TABLE IF NOT EXISTS "outfits_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "main_image" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`, "outfits_new");
  await run(`INSERT INTO outfits_new (id, event_name, date, main_image, user_id, created_at)
    SELECT id, event_name, date, main_image, user_id, created_at FROM outfits`, "copy outfits");
  await run(`DROP TABLE outfits`, "drop old outfits");
  await run(`ALTER TABLE outfits_new RENAME TO outfits`, "rename outfits");
  console.log("Migrated outfits: removed idol_name");
}

// favorites: outfit_id → type + target_id
const favCols = await tableColumns("favorites");
if (favCols.includes("outfit_id") && !favCols.includes("type")) {
  await run(`ALTER TABLE favorites ADD COLUMN type TEXT`, "fav add type");
  await run(`ALTER TABLE favorites ADD COLUMN target_id TEXT`, "fav add target_id");
  await run(
    `UPDATE favorites SET type = 'outfit', target_id = outfit_id WHERE type IS NULL`,
    "fav migrate outfit_id"
  );
  await run(
    `CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_type_target_key" ON "favorites"("user_id", "type", "target_id")`,
    "favorites_unique"
  );
  console.log("Migrated favorites → type + target_id");
}

// reports: item_id (legacy) + catalog_item_id
const reportCols = await tableColumns("reports");
if (!reportCols.includes("item_id")) {
  await run(`ALTER TABLE reports ADD COLUMN item_id TEXT`, "reports add item_id");
}
if (!reportCols.includes("catalog_item_id")) {
  await run(`ALTER TABLE reports ADD COLUMN catalog_item_id TEXT`, "reports add catalog_item_id");
}

// site_feedback: category + image (feedback modal)
const feedbackCols = await tableColumns("site_feedback");
if (!feedbackCols.includes("category")) {
  await run(
    `ALTER TABLE site_feedback ADD COLUMN category TEXT NOT NULL DEFAULT 'suggestion'`,
    "site_feedback add category"
  );
}
if (!feedbackCols.includes("image")) {
  await run(`ALTER TABLE site_feedback ADD COLUMN image TEXT`, "site_feedback add image");
}

// Remove legacy users columns (username/email NOT NULL breaks new inserts)
const userCols3 = await tableColumns("users");
if (userCols3.includes("username") || userCols3.includes("email")) {
  await run(`PRAGMA foreign_keys=OFF`, "fk off users");
  await run(
    `CREATE TABLE "users_clean" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "account" TEXT NOT NULL,
      "password_hash" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'user',
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    "users_clean"
  );
  const legacyUserCols = await tableColumns("users");
  const accountExpr = legacyUserCols.includes("username")
    ? legacyUserCols.includes("email")
      ? "COALESCE(account, username, email)"
      : "COALESCE(account, username)"
    : legacyUserCols.includes("email")
      ? "COALESCE(account, email)"
      : "account";
  await run(
    `INSERT INTO users_clean (id, account, password_hash, role, created_at)
     SELECT id, ${accountExpr}, password_hash, role, created_at
     FROM users`,
    "copy users clean"
  );
  await run(`DROP TABLE users`, "drop legacy users");
  await run(`ALTER TABLE users_clean RENAME TO users`, "rename users");
  await run(
    `CREATE UNIQUE INDEX IF NOT EXISTS "users_account_key" ON "users"("account")`,
    "users_account_key"
  );
  await run(`PRAGMA foreign_keys=ON`, "fk on users");
  console.log("Cleaned users table");
}

// Remove legacy favorites.outfit_id NOT NULL column
const favCols2 = await tableColumns("favorites");
if (favCols2.includes("outfit_id")) {
  await run(`PRAGMA foreign_keys=OFF`, "fk off favorites");
  await run(
    `CREATE TABLE "favorites_clean" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "user_id" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "target_id" TEXT NOT NULL,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    "favorites_clean"
  );
  await run(
    `INSERT INTO favorites_clean (id, user_id, type, target_id, created_at)
     SELECT id, user_id, COALESCE(type, 'outfit'), COALESCE(target_id, outfit_id), created_at
     FROM favorites
     WHERE COALESCE(target_id, outfit_id) IS NOT NULL`,
    "copy favorites clean"
  );
  await run(`DROP TABLE favorites`, "drop legacy favorites");
  await run(`ALTER TABLE favorites_clean RENAME TO favorites`, "rename favorites");
  await run(
    `CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_type_target_key" ON "favorites"("user_id", "type", "target_id")`,
    "favorites_unique"
  );
  await run(`PRAGMA foreign_keys=ON`, "fk on favorites");
  console.log("Cleaned favorites table");
}

const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
);

console.log("Turso tables ready:", tables.rows.map((r) => r.name).join(", "));
console.log("If upgrading from legacy items, run: npm run db:migrate-catalog");
