import { notFound } from "next/navigation";
import ItemDetailInfo from "@/components/ItemDetailInfo";
import ItemDetailOutfits from "@/components/ItemDetailOutfits";
import ItemDupesSection from "@/components/ItemDupesSection";
import { toDisplayItem } from "@/lib/catalog-item";
import {
  getCatalogItemRecord,
  getItemOutfitPlacements,
} from "@/lib/item-cache";
import { extractIdFromSlugParam } from "@/lib/slug";
import { listItemStaticParams } from "@/lib/static-params";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return listItemStaticParams();
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolvedId = extractIdFromSlugParam(id);

  const [item, placements] = await Promise.all([
    getCatalogItemRecord(resolvedId),
    getItemOutfitPlacements(resolvedId),
  ]);

  if (!item) notFound();

  return (
    <div className="min-w-0">
      <ItemDetailInfo item={toDisplayItem(item)} />
      <ItemDetailOutfits
        outfits={placements.map((row) => ({
          id: row.outfit.id,
          mainImage: row.outfit.mainImage,
          eventName: row.outfit.eventName,
          date: row.outfit.date,
        }))}
      />
      <ItemDupesSection catalogItemId={resolvedId} />
    </div>
  );
}
