import { notFound } from "next/navigation";
import OutfitDetailContent from "@/components/OutfitDetailContent";
import OutfitDetailHeader from "@/components/OutfitDetailHeader";
import { getOutfitDisplayItems } from "@/lib/catalog-item";
import { getOutfitRecord } from "@/lib/outfit-cache";
import { getOutfitNeighborsByCreatedAt } from "@/lib/outfit-nav";
import { formatOutfitTitle } from "@/lib/outfit";
import { extractIdFromSlugParam } from "@/lib/slug";
import { listOutfitStaticParams } from "@/lib/static-params";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return listOutfitStaticParams();
}

export default async function OutfitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolvedId = extractIdFromSlugParam(id);

  const outfit = await getOutfitRecord(resolvedId);
  if (!outfit) notFound();

  const title = formatOutfitTitle(outfit.date, outfit.eventName);
  const [neighbors, items] = await Promise.all([
    getOutfitNeighborsByCreatedAt(outfit.createdAt),
    getOutfitDisplayItems(resolvedId),
  ]);

  return (
    <div className="min-w-0">
      <OutfitDetailHeader outfitId={outfit.id} outfitTitle={title} />
      <OutfitDetailContent
        outfitId={outfit.id}
        outfitTitle={title}
        mainImage={outfit.mainImage}
        imageAlt={title}
        items={items}
        newer={neighbors.newer}
        older={neighbors.older}
      />
    </div>
  );
}
