import { formatOutfitTitle } from "@/lib/outfit";
import { compareOutfitDates, normalizeOutfitDate } from "@/lib/outfit-sort";
import { normalizeItemType } from "@/lib/types";

function latestPlacementDate(
  placements: { outfit: { date: string } }[]
): string {
  let latest = "";
  for (const placement of placements) {
    const normalized = normalizeOutfitDate(placement.outfit.date);
    if (!normalized) continue;
    if (!latest || normalized > latest) latest = normalized;
  }
  return latest;
}

type CatalogRow = {
  id: string;
  type: string;
  brand: string | null;
  productName: string | null;
  notes: string | null;
  useCount: number;
  createdAt: Date;
  images: { url: string }[];
  placements: {
    outfit: {
      id: string;
      eventName: string;
      date: string;
      createdAt: Date;
    };
  }[];
};

export function toItemSummary(item: CatalogRow) {
  const primaryOutfit = [...item.placements]
    .sort((a, b) => compareOutfitDates(a.outfit.date, b.outfit.date, "desc"))[0]
    ?.outfit;
  const outfitTitle = primaryOutfit
    ? formatOutfitTitle(primaryOutfit.date, primaryOutfit.eventName)
    : "";

  return {
    id: item.id,
    image: item.images[0]?.url ?? null,
    type: normalizeItemType(item.type),
    brand: item.brand,
    productName: item.productName,
    useCount: item.useCount,
    createdAt: item.createdAt.toISOString(),
    outfitId: primaryOutfit?.id ?? "",
    outfitTitle,
    outfitDate: primaryOutfit?.date ?? "",
    latestOutfitDate: latestPlacementDate(item.placements),
    outfitCreatedAt: primaryOutfit?.createdAt ?? item.createdAt,
    searchText: [
      item.brand,
      item.productName,
      item.notes,
      ...item.placements.map((p) =>
        formatOutfitTitle(p.outfit.date, p.outfit.eventName)
      ),
    ]
      .filter(Boolean)
      .join(" "),
  };
}

export type ItemSummary = ReturnType<typeof toItemSummary>;
