import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listCatalogDupes } from "@/lib/catalog-dupe";
import { moderateText } from "@/lib/content-moderation";
import { resolveVoterKey } from "@/lib/dupe-actor";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const voterKey = resolveVoterKey(request, user?.id);

  const item = await prisma.catalogItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "找不到單品" }, { status: 404 });
  }

  const dupes = await listCatalogDupes(id, voterKey);
  return NextResponse.json({ dupes });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const item = await prisma.catalogItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "找不到單品" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const brandRaw = formData.get("brand");
    const productNameRaw = formData.get("productName");
    const priceRangeRaw = formData.get("priceRange");
    const buyLinkRaw = formData.get("buyLink");
    const notesRaw = formData.get("notes");
    const imageFile = formData.get("image");

    if (typeof brandRaw !== "string" || !brandRaw.trim()) {
      return NextResponse.json({ error: "請輸入品牌" }, { status: 400 });
    }
    if (typeof buyLinkRaw !== "string" || !buyLinkRaw.trim()) {
      return NextResponse.json({ error: "請輸入購買連結" }, { status: 400 });
    }
    if (!(imageFile instanceof File) || imageFile.size === 0) {
      return NextResponse.json({ error: "請選擇圖片" }, { status: 400 });
    }

    const brand = brandRaw.trim();
    const buyLink = buyLinkRaw.trim();
    const productName =
      typeof productNameRaw === "string" && productNameRaw.trim()
        ? productNameRaw.trim()
        : null;
    const priceRange =
      typeof priceRangeRaw === "string" && priceRangeRaw.trim()
        ? priceRangeRaw.trim()
        : null;
    const notes =
      typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim() : null;

    for (const [label, text] of [
      ["品牌", brand],
      ["商品名稱", productName],
      ["價格區間", priceRange],
      ["備註", notes],
    ] as const) {
      if (!text) continue;
      const check = moderateText(text, label);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
    }

    const { saveUploadedFile } = await import("@/lib/upload");
    const imageUrl = await saveUploadedFile(imageFile, "item");

    const created = await prisma.catalogDupe.create({
      data: {
        catalogItemId: id,
        userId: user?.id ?? null,
        image: imageUrl,
        brand,
        productName,
        priceRange,
        buyLink,
        notes,
      },
      include: { votes: { select: { vote: true, voterKey: true } } },
    });

    const voterKey = resolveVoterKey(request, user?.id);
    const dupes = await listCatalogDupes(id, voterKey);
    const dupe = dupes.find((row) => row.id === created.id);

    return NextResponse.json({ ok: true, dupe, dupes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "送出失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
