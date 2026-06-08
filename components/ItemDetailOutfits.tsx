"use client";

import { useTranslation } from "react-i18next";
import OutfitCard from "./OutfitCard";

type OutfitRef = {
  id: string;
  mainImage: string;
  eventName: string;
  date: string;
};

export default function ItemDetailOutfits({
  outfits,
}: {
  outfits: OutfitRef[];
}) {
  const { t } = useTranslation();

  return (
    <section className="mt-6 border-t border-border pt-5">
      <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
        {t("item.outfitsSection")}
      </h2>
      {outfits.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t("item.noOutfits")}</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {outfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              id={outfit.id}
              mainImage={outfit.mainImage}
              eventName={outfit.eventName}
              date={outfit.date}
            />
          ))}
        </div>
      )}
    </section>
  );
}
