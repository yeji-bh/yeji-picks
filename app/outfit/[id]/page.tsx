import { notFound } from "next/navigation";
import OutfitDetailContent from "@/components/OutfitDetailContent";
import OutfitDetailHeader from "@/components/OutfitDetailHeader";
import { getOutfitDisplayItems } from "@/lib/catalog-item";
import { prisma } from "@/lib/db";
import { getOutfitNeighbors } from "@/lib/outfit-nav";
import { formatOutfitTitle } from "@/lib/outfit";

export const dynamic = "force-dynamic";

export default async function OutfitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [outfit, neighbors, items] = await Promise.all([
    prisma.outfit.findUnique({ where: { id } }),
    getOutfitNeighbors(id),
    getOutfitDisplayItems(id),
  ]);

  if (!outfit) {
    notFound();
  }

  const title = formatOutfitTitle(outfit.date, outfit.eventName);

  return (
    <div className="min-w-0">
      <OutfitDetailHeader outfitId={outfit.id} outfitTitle={title} />

      <OutfitDetailContent
        outfitId={outfit.id}
        outfitTitle={title}
        mainImage={outfit.mainImage}
        imageAlt={title}
        items={items}
        newerId={neighbors.newerId}
        olderId={neighbors.olderId}
      />
    </div>
  );
}
