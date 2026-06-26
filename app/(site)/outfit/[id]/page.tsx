import type { Metadata } from "next";
import OutfitDetailLoader from "@/components/OutfitDetailLoader";
import { prisma } from "@/lib/db";
import { formatOutfitTitle } from "@/lib/outfit";
import { extractIdFromSlugParam } from "@/lib/slug";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const resolvedId = extractIdFromSlugParam(id);
  const outfit = await prisma.outfit.findUnique({
    where: { id: resolvedId },
    select: { eventName: true, date: true },
  });

  if (!outfit) {
    return { title: "Outfit" };
  }

  return { title: formatOutfitTitle(outfit.date, outfit.eventName) };
}

export default async function OutfitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolvedId = extractIdFromSlugParam(id);

  return <OutfitDetailLoader outfitId={resolvedId} />;
}
