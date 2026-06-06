import { normalizeItemType } from "@/lib/types";

type OutfitWithItems = {
  id: string;
  mainImage: string;
  eventName: string;
  date: string;
  items: { type: string; brand: string | null; productName: string | null; notes: string | null }[];
};

export function toOutfitSummary(outfit: OutfitWithItems) {
  return {
    id: outfit.id,
    mainImage: outfit.mainImage,
    eventName: outfit.eventName,
    date: outfit.date,
    itemTypes: [
      ...new Set(outfit.items.map((item) => normalizeItemType(item.type))),
    ],
    searchText: [
      outfit.eventName,
      outfit.date,
      ...outfit.items.flatMap((item) => [
        item.brand,
        item.productName,
        item.notes,
      ]),
    ]
      .filter(Boolean)
      .join(" "),
  };
}
