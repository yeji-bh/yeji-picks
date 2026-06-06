"use client";

import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <div className="detail-item-list min-w-0 lg:justify-self-end">
      <h2 className="border-b border-border pb-3 text-base font-semibold text-neutral-900 sm:text-lg">
        {t("outfit.items")}
      </h2>
      <ItemList items={items} outfitId={outfitId} outfitTitle={outfitTitle} />
    </div>
  );
}
