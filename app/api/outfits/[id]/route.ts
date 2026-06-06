import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import {
  cleanupReplacedUploads,
  collectOutfitImages,
  collectPayloadImages,
} from "@/lib/delete-upload";
import { prisma } from "@/lib/db";
import { revalidateOutfitCaches } from "@/lib/revalidate-outfits";
import { validateSubmissionPayload } from "@/lib/submission";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const outfit = await prisma.outfit.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!outfit) {
    return NextResponse.json({ error: "找不到穿搭" }, { status: 404 });
  }

  return NextResponse.json({
    id: outfit.id,
    eventName: outfit.eventName,
    date: outfit.date,
    mainImage: outfit.mainImage,
    items: outfit.items.map((item) => ({
      type: item.type,
      brand: item.brand ?? "",
      productName: item.productName ?? "",
      image: item.image ?? "",
      officialLink: item.officialLink ?? "",
      notes: item.notes ?? "",
    })),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const payload = validateSubmissionPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "資料格式不正確" }, { status: 400 });
    }

    const outfit = await prisma.outfit.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!outfit) {
      return NextResponse.json({ error: "找不到穿搭" }, { status: 404 });
    }

    const previousImages = collectOutfitImages(outfit);
    const nextImages = collectPayloadImages(payload);

    await prisma.$transaction(async (tx) => {
      await tx.outfit.update({
        where: { id },
        data: {
          eventName: payload.eventName,
          date: payload.date,
          mainImage: payload.mainImage,
        },
      });

      await tx.item.deleteMany({ where: { outfitId: id } });

      if (payload.items.length > 0) {
        await tx.item.createMany({
          data: payload.items.map((item) => ({
            outfitId: id,
            type: item.type,
            brand: item.brand || null,
            productName: item.productName || null,
            image: item.image || null,
            officialLink: item.officialLink || null,
            notes: item.notes || null,
          })),
        });
      }

      await tx.submission.updateMany({
        where: { outfitId: id },
        data: { rawJson: JSON.stringify(payload) },
      });
    });

    await cleanupReplacedUploads(previousImages, nextImages);

    revalidateOutfitCaches(id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}
