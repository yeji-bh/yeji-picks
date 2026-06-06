import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const repair = process.argv.includes("--repair");

if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const adapter = new PrismaLibSQL({
  url,
  authToken: authToken || undefined,
});

const prisma = new PrismaClient({ adapter });

function normalizeDate(date) {
  return (date || "").replace(/-/g, "").trim();
}

function normalizeEventName(name) {
  return (name || "").replace(/^\d+\s*/, "").trim();
}

/** Never use bare "::" — unnamed outfits match by mainImage instead. */
function matchKey(date, eventName, mainImage) {
  const d = normalizeDate(date);
  const e = normalizeEventName(eventName);
  if (!d && !e) {
    return mainImage ? `img::${mainImage}` : null;
  }
  return `${d}::${e}`;
}

function parsePayload(rawJson) {
  const data = JSON.parse(rawJson);
  return {
    eventName: data.eventName ?? "",
    date: data.date ?? "",
    mainImage: data.mainImage ?? "",
    items: Array.isArray(data.items) ? data.items : [],
  };
}

function itemSignature(items) {
  return items
    .map(
      (item) =>
        `${item.type}|${item.brand ?? ""}|${item.productName ?? ""}|${item.image ?? ""}`
    )
    .sort()
    .join(";;");
}

async function replaceOutfitItems(outfitId, items) {
  await prisma.item.deleteMany({ where: { outfitId } });

  if (items.length === 0) return;

  await prisma.item.createMany({
    data: items.map((item) => ({
      outfitId,
      type: item.type || "other",
      brand: item.brand || null,
      productName: item.productName || null,
      image: item.image || null,
      officialLink: item.officialLink || null,
      notes: item.notes || null,
    })),
  });
}

async function findOutfitForSubmission(sub, subsByKey, outfitByImage) {
  if (sub.outfitId) {
    const linked = await prisma.outfit.findUnique({
      where: { id: sub.outfitId },
      include: { items: true },
    });
    if (linked) return linked;
  }

  const payload = parsePayload(sub.rawJson);
  const key = matchKey(payload.date, payload.eventName, payload.mainImage);
  if (key && subsByKey.get(key)?.id === sub.id && outfitByImage.has(payload.mainImage)) {
    return outfitByImage.get(payload.mainImage);
  }

  if (payload.mainImage) {
    const byImage = await prisma.outfit.findFirst({
      where: { mainImage: payload.mainImage },
      include: { items: true },
    });
    if (byImage) return byImage;
  }

  return null;
}

let restored = 0;
let repaired = 0;
let linked = 0;
let skipped = 0;
let failed = 0;

const approvedSubs = await prisma.submission.findMany({
  where: { status: "approved" },
  select: { id: true, outfitId: true, rawJson: true },
});

const subsByKey = new Map();
for (const sub of approvedSubs) {
  try {
    const payload = parsePayload(sub.rawJson);
    const key = matchKey(payload.date, payload.eventName, payload.mainImage);
    if (key) subsByKey.set(key, sub);
  } catch {
    /* ignore */
  }
}

const allOutfits = await prisma.outfit.findMany({
  include: { items: true },
});
const outfitByImage = new Map(
  allOutfits.filter((o) => o.mainImage).map((o) => [o.mainImage, o])
);

if (repair) {
  console.log(`Repair mode: checking ${approvedSubs.length} approved submissions`);

  for (const sub of approvedSubs) {
    try {
      const payload = parsePayload(sub.rawJson);
      if (payload.items.length === 0) {
        skipped++;
        continue;
      }

      const outfit = await findOutfitForSubmission(sub, subsByKey, outfitByImage);
      if (!outfit) {
        console.log(`Skip repair ${sub.id}: no matching outfit`);
        skipped++;
        continue;
      }

      const currentSig = itemSignature(outfit.items);
      const expectedSig = itemSignature(payload.items);

      if (!sub.outfitId || sub.outfitId !== outfit.id) {
        await prisma.submission.update({
          where: { id: sub.id },
          data: { outfitId: outfit.id },
        });
        console.log(`Linked submission ${sub.id} → outfit ${outfit.id}`);
        linked++;
      }

      if (currentSig !== expectedSig) {
        await replaceOutfitItems(outfit.id, payload.items);
        console.log(
          `Repaired items for ${outfit.id} (${outfit.date} ${outfit.eventName || "未命名"})`
        );
        repaired++;
      }
    } catch (err) {
      failed++;
      console.error(
        `Fail repair ${sub.id}:`,
        err instanceof Error ? err.message : err
      );
    }
  }
}

const emptyOutfits = await prisma.outfit.findMany({
  where: { items: { none: {} } },
  select: { id: true, eventName: true, date: true, mainImage: true },
});

console.log(
  `Found ${emptyOutfits.length} outfits without items (${approvedSubs.length} approved submissions)`
);

for (const outfit of emptyOutfits) {
  try {
    let sub = approvedSubs.find((s) => s.outfitId === outfit.id);
    if (!sub) {
      const key = matchKey(outfit.date, outfit.eventName, outfit.mainImage);
      if (key) sub = subsByKey.get(key);
    }

    if (!sub) {
      console.log(
        `Skip ${outfit.id} (${outfit.date} ${outfit.eventName || "未命名"}): no matching submission`
      );
      skipped++;
      continue;
    }

    const payload = parsePayload(sub.rawJson);
    if (payload.items.length === 0) {
      console.log(`Skip ${outfit.id}: submission has no items`);
      skipped++;
      continue;
    }

    await replaceOutfitItems(outfit.id, payload.items);
    console.log(
      `Restored ${payload.items.length} items for ${outfit.id} (${outfit.eventName || "未命名"})`
    );
    restored++;

    if (!sub.outfitId) {
      await prisma.submission.update({
        where: { id: sub.id },
        data: { outfitId: outfit.id },
      });
      console.log(`  Linked submission ${sub.id} → outfit ${outfit.id}`);
      linked++;
    }
  } catch (err) {
    failed++;
    console.error(
      `Fail ${outfit.id}:`,
      err instanceof Error ? err.message : err
    );
  }
}

console.log(
  `Done: restored ${restored}, repaired ${repaired}, linked ${linked}, skipped ${skipped}, failed ${failed}`
);

await prisma.$disconnect();
