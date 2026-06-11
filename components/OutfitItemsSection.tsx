"use client";

import ItemList from "./ItemList";

type Item = {
  id: string;
  type: string;
  brand: string | null;
  productName: string | null;
  image: string | null;
  officialLink: string | null;
  notes: string | null;
  linkStatus: string | null;
  useCount: number;
};

export default function OutfitItemsSection({
  items,
  outfitId,
  outfitTitle,
}: {
  items: Item[];
  outfitId: string;
  outfitTitle: string;
}) {
  return (
    <div className="detail-item-list min-w-0 lg:justify-self-end">
      <ItemList items={items} outfitId={outfitId} outfitTitle={outfitTitle} />
    </div>
  );
}
