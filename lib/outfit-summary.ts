import { normalizeItemType } from "@/lib/types";

type OutfitWithItems = {
  id: string;
  mainImage: string;
  eventName: string;
  date: string;
  outfitItems: {
    catalogItem: {
      type: string;
      brand: string | null;
      productName: string | null;
      notes: string | null;
    };
  }[];
};

export function toOutfitSummary(outfit: OutfitWithItems) {
  const catalogItems = outfit.outfitItems.map((row) => row.catalogItem);
  return {
    id: outfit.id,
    mainImage: outfit.mainImage,
    eventName: outfit.eventName,
    date: outfit.date,
    itemTypes: [
      ...new Set(catalogItems.map((item) => normalizeItemType(item.type))),
    ],
    searchText: [
      outfit.eventName,
      outfit.date,
      ...catalogItems.flatMap((item) => [
        item.brand,
        item.productName,
        item.notes,
      ]),
    ]
      .filter(Boolean)
      .join(" "),
  };
}
