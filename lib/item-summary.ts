import { formatOutfitTitle } from "@/lib/outfit";
import { normalizeItemType } from "@/lib/types";

type ItemWithOutfit = {
  id: string;
  type: string;
  brand: string | null;
  productName: string | null;
  image: string | null;
  notes: string | null;
  outfit: {
    id: string;
    eventName: string;
    date: string;
    createdAt: Date;
  };
};

export function toItemSummary(item: ItemWithOutfit) {
  const outfitTitle = formatOutfitTitle(item.outfit.date, item.outfit.eventName);

  return {
    id: item.id,
    image: item.image,
    type: normalizeItemType(item.type),
    brand: item.brand,
    productName: item.productName,
    outfitId: item.outfit.id,
    outfitTitle,
    outfitDate: item.outfit.date,
    outfitCreatedAt: item.outfit.createdAt,
    searchText: [
      outfitTitle,
      item.outfit.date,
      item.brand,
      item.productName,
      item.notes,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

export type ItemSummary = ReturnType<typeof toItemSummary>;
