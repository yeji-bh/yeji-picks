import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkLink } from "@/lib/link-check";
import { formatOutfitTitle } from "@/lib/outfit";

function mapDeadLink(item: {
  id: string;
  outfitId: string;
  brand: string | null;
  productName: string | null;
  officialLink: string | null;
  linkCheckedAt: Date | null;
  outfit: { date: string; eventName: string };
}) {
  return {
    itemId: item.id,
    outfitId: item.outfitId,
    outfitTitle: formatOutfitTitle(item.outfit.date, item.outfit.eventName),
    brand: item.brand,
    productName: item.productName,
    officialLink: item.officialLink,
    linkCheckedAt: item.linkCheckedAt,
  };
}

export async function POST() {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const items = await prisma.item.findMany({
    where: { officialLink: { not: null } },
    select: { id: true, officialLink: true },
  });

  let checked = 0;
  let dead = 0;

  for (const item of items) {
    if (!item.officialLink) continue;

    const status = await checkLink(item.officialLink);
    checked += 1;
    if (status === "dead") dead += 1;

    await prisma.item.update({
      where: { id: item.id },
      data: {
        linkStatus: status,
        linkCheckedAt: new Date(),
      },
    });
  }

  const deadLinks = await prisma.item.findMany({
    where: { linkStatus: "dead" },
    select: {
      id: true,
      outfitId: true,
      brand: true,
      productName: true,
      officialLink: true,
      linkCheckedAt: true,
      outfit: { select: { date: true, eventName: true } },
    },
    orderBy: { linkCheckedAt: "desc" },
  });

  return NextResponse.json({
    checked,
    dead,
    deadLinks: deadLinks.map(mapDeadLink),
  });
}

export async function GET() {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const deadLinks = await prisma.item.findMany({
    where: { linkStatus: "dead" },
    select: {
      id: true,
      outfitId: true,
      brand: true,
      productName: true,
      officialLink: true,
      linkCheckedAt: true,
      outfit: { select: { date: true, eventName: true } },
    },
    orderBy: { linkCheckedAt: "desc" },
  });

  return NextResponse.json({
    deadLinks: deadLinks.map(mapDeadLink),
  });
}
