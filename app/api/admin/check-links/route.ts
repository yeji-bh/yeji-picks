import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkLink } from "@/lib/link-check";
import { formatOutfitTitle } from "@/lib/outfit";

function mapDeadLink(item: {
  id: string;
  brand: string | null;
  productName: string | null;
  officialLink: string | null;
  linkCheckedAt: Date | null;
  placements: {
    outfit: { id: string; date: string; eventName: string };
  }[];
}) {
  const outfit = item.placements[0]?.outfit;
  return {
    itemId: item.id,
    outfitId: outfit?.id ?? "",
    outfitTitle: outfit
      ? formatOutfitTitle(outfit.date, outfit.eventName)
      : "",
    brand: item.brand,
    productName: item.productName,
    officialLink: item.officialLink,
    linkCheckedAt: item.linkCheckedAt,
  };
}

const deadLinkSelect = {
  id: true,
  brand: true,
  productName: true,
  officialLink: true,
  linkCheckedAt: true,
  placements: {
    take: 1,
    select: {
      outfit: { select: { id: true, date: true, eventName: true } },
    },
  },
} as const;

export async function POST() {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const items = await prisma.catalogItem.findMany({
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

    await prisma.catalogItem.update({
      where: { id: item.id },
      data: {
        linkStatus: status,
        linkCheckedAt: new Date(),
      },
    });
  }

  const deadLinks = await prisma.catalogItem.findMany({
    where: { linkStatus: "dead" },
    select: deadLinkSelect,
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

  const deadLinks = await prisma.catalogItem.findMany({
    where: { linkStatus: "dead" },
    select: deadLinkSelect,
    orderBy: { linkCheckedAt: "desc" },
  });

  return NextResponse.json({
    deadLinks: deadLinks.map(mapDeadLink),
  });
}
