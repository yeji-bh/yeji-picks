import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatOutfitTitle } from "@/lib/outfit";

export async function GET() {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const [siteRows, reportRows] = await Promise.all([
    prisma.siteFeedback.findMany({
      select: {
        id: true,
        category: true,
        message: true,
        image: true,
        status: true,
        createdAt: true,
        user: { select: { account: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.report.findMany({
      select: {
        id: true,
        message: true,
        status: true,
        createdAt: true,
        outfitId: true,
        itemId: true,
        outfit: { select: { date: true, eventName: true } },
        item: {
          select: { type: true, brand: true, productName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    siteFeedback: siteRows.map((row) => ({
      id: row.id,
      category: row.category,
      message: row.message,
      image: row.image,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      userAccount: row.user?.account ?? null,
    })),
    reports: reportRows.map((row) => ({
      id: row.id,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      outfitId: row.outfitId,
      itemId: row.itemId,
      outfitTitle: formatOutfitTitle(row.outfit.date, row.outfit.eventName),
      itemType: row.item?.type ?? null,
      itemBrand: row.item?.brand ?? null,
      itemProductName: row.item?.productName ?? null,
    })),
  });
}
