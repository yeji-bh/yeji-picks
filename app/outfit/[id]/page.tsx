import { notFound } from "next/navigation";
import OutfitDetailContent from "@/components/OutfitDetailContent";
import OutfitDetailHeader from "@/components/OutfitDetailHeader";
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

  const [outfit, neighbors] = await Promise.all([
    prisma.outfit.findUnique({
      where: { id },
      include: { items: true },
    }),
    getOutfitNeighbors(id),
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
        items={outfit.items}
        newerId={neighbors.newerId}
        olderId={neighbors.olderId}
      />
    </div>
  );
}
