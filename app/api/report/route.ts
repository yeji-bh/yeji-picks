import { NextRequest, NextResponse } from "next/server";
import { moderateText } from "@/lib/content-moderation";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { outfitId, itemId, message } = await request.json();

    if (
      typeof outfitId !== "string" ||
      !outfitId ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return NextResponse.json({ error: "資料格式不正確" }, { status: 400 });
    }

    const textCheck = moderateText(message, "回報內容");
    if (!textCheck.ok) {
      return NextResponse.json({ error: textCheck.error }, { status: 400 });
    }

    const outfit = await prisma.outfit.findUnique({
      where: { id: outfitId },
    });

    if (!outfit) {
      return NextResponse.json({ error: "找不到穿搭" }, { status: 404 });
    }

    if (itemId) {
      if (typeof itemId !== "string") {
        return NextResponse.json({ error: "資料格式不正確" }, { status: 400 });
      }
      const placement = await prisma.outfitItem.findFirst({
        where: { outfitId, catalogItemId: itemId },
      });
      if (!placement) {
        return NextResponse.json({ error: "找不到單品" }, { status: 404 });
      }
    }

    const report = await prisma.report.create({
      data: {
        outfitId,
        catalogItemId: typeof itemId === "string" && itemId ? itemId : null,
        message: message.trim(),
        status: "pending",
      },
    });

    return NextResponse.json({ id: report.id });
  } catch {
    return NextResponse.json({ error: "送出失敗" }, { status: 500 });
  }
}
