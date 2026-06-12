import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, moderationError } from "@/lib/api-error";
import { listCatalogDupes } from "@/lib/catalog-dupe";
import { moderateOptionalText, moderateText } from "@/lib/content-moderation";
import { resolveVoterKey } from "@/lib/dupe-actor";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const voterKey = resolveVoterKey(request, user?.id);

    const item = await prisma.catalogItem.findUnique({ where: { id } });
    if (!item) {
      return apiError(request, "api.errors.notFoundItem", 404);
    }

    const dupes = await listCatalogDupes(id, voterKey);
    return NextResponse.json({ dupes });
  } catch (err) {
    console.error("[dupes GET]", err);
    return apiError(request, "api.errors.loadFailed", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const item = await prisma.catalogItem.findUnique({ where: { id } });
  if (!item) {
    return apiError(request, "api.errors.notFoundItem", 404);
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
      return apiError(request, "api.errors.enterBrand", 400);
    }
    if (typeof buyLinkRaw !== "string" || !buyLinkRaw.trim()) {
      return apiError(request, "api.errors.enterLink", 400);
    }
    if (!(imageFile instanceof File) || imageFile.size === 0) {
      return apiError(request, "api.errors.selectImage", 400);
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

    const brandCheck = moderateText(brand, "dupeBrand");
    if (!brandCheck.ok) {
      return moderationError(request, brandCheck.field, brandCheck.code);
    }

    const linkCheck = moderateText(buyLink, "dupeLink");
    if (!linkCheck.ok) {
      return moderationError(request, linkCheck.field, linkCheck.code);
    }

    for (const [value, field] of [
      [productName, "productName"],
      [priceRange, "notes"],
      [notes, "notes"],
    ] as const) {
      const check = moderateOptionalText(value, field);
      if (!check.ok) {
        return moderationError(request, check.field, check.code);
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
  } catch {
    return apiError(request, "api.errors.submitFailed", 500);
  }
}
