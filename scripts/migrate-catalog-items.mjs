/**
 * Migrate legacy `items` rows into catalog_items + catalog_item_images + outfit_items.
 *
 * Usage: node --env-file=.env scripts/migrate-catalog-items.mjs
 */
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const adapter = new PrismaLibSQL({ url, authToken: authToken || undefined });
const prisma = new PrismaClient({ adapter });

const LEGACY_TYPE_MAP = {
  hat: "hat_other",
  top: "top_other",
  bottom: "bottom_other",
  shoes: "shoes_other",
  bag: "bag",
  bag_handbag: "bag",
  bag_shoulder: "bag",
  bag_backpack: "bag",
  bag_clutch: "bag",
  bag_other: "bag",
  top_tshirt: "top_shortsleeve",
  top_blazer: "top_other",
  shoes_loafers: "shoes_other",
  jewelry: "jewelry_other",
  eyewear: "eyewear_glasses",
  belt: "other",
  socks: "other",
  scarf: "other",
  accessory: "other",
};

function normalizeItemType(type) {
  if (!type || typeof type !== "string") return "other";
  return LEGACY_TYPE_MAP[type] ?? type;
}

function catalogFingerprint(row) {
  const type = normalizeItemType(row.type);
  const brand = (row.brand ?? "").trim().toLowerCase();
  const name = (row.product_name ?? row.productName ?? "").trim().toLowerCase();
  return `${type}::${brand}::${name}`;
}

function newId() {
  return randomUUID().replace(/-/g, "").slice(0, 25);
}

async function tableExists(name) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    name
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function recalcAllUseCounts() {
  const items = await prisma.catalogItem.findMany({ select: { id: true } });
  for (const { id } of items) {
    const count = await prisma.outfitItem.count({
      where: { catalogItemId: id },
    });
    await prisma.catalogItem.update({
      where: { id },
      data: { useCount: count },
    });
  }
  console.log(`Recalculated useCount for ${items.length} catalog items`);
}

async function main() {
  const hasCatalog = await tableExists("catalog_items");
  if (!hasCatalog) {
    console.error("catalog_items table missing — run db:setup-turso first");
    process.exit(1);
  }

  const existingPlacements = await prisma.outfitItem.count();
  if (existingPlacements > 0) {
    console.log(`Skip migration: outfit_items already has ${existingPlacements} rows`);
    await recalcAllUseCounts();
    await prisma.$disconnect();
    return;
  }

  const hasLegacy = await tableExists("items");
  if (!hasLegacy) {
    console.log("No legacy items table — nothing to migrate");
    await prisma.$disconnect();
    return;
  }

  const legacyRows = await prisma.$queryRawUnsafe(
    `SELECT id, outfit_id, type, brand, product_name, image, official_link, notes, link_status, link_checked_at
     FROM items ORDER BY outfit_id, id`
  );

  if (!legacyRows.length) {
    console.log("Legacy items table is empty");
    await prisma.$disconnect();
    return;
  }

  console.log(`Migrating ${legacyRows.length} legacy item rows...`);

  const fingerprintToCatalog = new Map();
  const oldItemToCatalog = new Map();
  const catalogImages = new Map();

  for (const row of legacyRows) {
    const fp = catalogFingerprint(row);
    let catalogId = fingerprintToCatalog.get(fp);

    if (!catalogId) {
      catalogId = newId();
      fingerprintToCatalog.set(fp, catalogId);

      await prisma.catalogItem.create({
        data: {
          id: catalogId,
          type: normalizeItemType(row.type),
          brand: row.brand?.trim() || null,
          productName: row.product_name?.trim() || null,
          officialLink: row.official_link?.trim() || null,
          notes: row.notes?.trim() || null,
          linkStatus: row.link_status || null,
          linkCheckedAt: row.link_checked_at ? new Date(row.link_checked_at) : null,
          useCount: 0,
        },
      });
      catalogImages.set(catalogId, new Set());
    } else {
      const existing = await prisma.catalogItem.findUnique({
        where: { id: catalogId },
      });
      if (existing) {
        const updates = {};
        if (!existing.officialLink && row.official_link?.trim()) {
          updates.officialLink = row.official_link.trim();
        }
        if (!existing.notes && row.notes?.trim()) {
          updates.notes = row.notes.trim();
        }
        if (!existing.linkStatus && row.link_status) {
          updates.linkStatus = row.link_status;
        }
        if (!existing.linkCheckedAt && row.link_checked_at) {
          updates.linkCheckedAt = new Date(row.link_checked_at);
        }
        if (Object.keys(updates).length > 0) {
          await prisma.catalogItem.update({
            where: { id: catalogId },
            data: updates,
          });
        }
      }
    }

    oldItemToCatalog.set(row.id, catalogId);

    const imageUrl = row.image?.trim();
    if (imageUrl) {
      const known = catalogImages.get(catalogId);
      if (!known.has(imageUrl)) {
        const sortOrder = known.size;
        await prisma.catalogItemImage.create({
          data: {
            id: newId(),
            catalogItemId: catalogId,
            url: imageUrl,
            sortOrder,
          },
        });
        known.add(imageUrl);
      }
    }

    try {
      await prisma.outfitItem.create({
        data: {
          id: newId(),
          outfitId: row.outfit_id,
          catalogItemId: catalogId,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("UNIQUE")) {
        throw err;
      }
    }
  }

  await recalcAllUseCounts();

  const reportCols = await prisma.$queryRawUnsafe(`PRAGMA table_info(reports)`);
  const hasItemId = reportCols.some((c) => c.name === "item_id");
  const hasCatalogItemId = reportCols.some((c) => c.name === "catalog_item_id");

  if (hasItemId && hasCatalogItemId) {
    for (const [oldId, catalogId] of oldItemToCatalog) {
      await prisma.$executeRawUnsafe(
        `UPDATE reports SET catalog_item_id = ? WHERE item_id = ? AND (catalog_item_id IS NULL OR catalog_item_id = '')`,
        catalogId,
        oldId
      );
    }
    console.log("Updated reports.item_id → catalog_item_id");
  }

  const favRows = await prisma.favorite.findMany({
    where: { type: "item" },
    select: { id: true, targetId: true },
  });

  let favRemapped = 0;
  for (const fav of favRows) {
    const catalogId = oldItemToCatalog.get(fav.targetId);
    if (catalogId && catalogId !== fav.targetId) {
      try {
        await prisma.favorite.update({
          where: { id: fav.id },
          data: { targetId: catalogId },
        });
        favRemapped++;
      } catch {
        await prisma.favorite.delete({ where: { id: fav.id } });
      }
    }
  }

  console.log(
    `Done: ${fingerprintToCatalog.size} catalog items, ${legacyRows.length} placements, ${favRemapped} favorites remapped`
  );
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
