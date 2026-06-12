"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider";
import OutfitCard from "./OutfitCard";
import ItemCard from "./ItemCard";
import ViewModeTabs from "./ViewModeTabs";
import {
  getFavoriteItemIds,
  getFavoriteOutfitIds,
} from "@/lib/favorites";
import type { HomeViewMode } from "@/lib/home-view-mode";
import type { OutfitSummary } from "./HomeContent";

type FavoriteItem = {
  id: string;
  type: string;
  brand: string | null;
  productName: string | null;
  image: string | null;
  useCount: number;
};

const GRID_CLASS =
  "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4";

export default function FavoritesContent({
  initialOutfits = [],
  initialItems = [],
}: {
  initialOutfits?: OutfitSummary[];
  initialItems?: FavoriteItem[];
}) {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<HomeViewMode>("outfit");
  const [outfits, setOutfits] = useState<OutfitSummary[]>(initialOutfits);
  const [items, setItems] = useState<FavoriteItem[]>(initialItems);
  const [loading, setLoading] = useState(
    initialOutfits.length === 0 && initialItems.length === 0
  );

  useEffect(() => {
    if (authLoading) return;

    if (user && (initialOutfits.length > 0 || initialItems.length > 0)) {
      setOutfits(initialOutfits);
      setItems(initialItems);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const outfitIds = getFavoriteOutfitIds();
        const itemIds = getFavoriteItemIds();

        const outfitUrl = user
          ? "/api/favorites/outfits"
          : outfitIds.length > 0
            ? `/api/favorites/outfits?ids=${outfitIds.join(",")}`
            : null;

        const itemUrl = user
          ? "/api/favorites/items"
          : itemIds.length > 0
            ? `/api/favorites/items?ids=${itemIds.join(",")}`
            : null;

        const [outfitRes, itemRes] = await Promise.all([
          outfitUrl ? fetch(outfitUrl) : null,
          itemUrl ? fetch(itemUrl) : null,
        ]);

        if (outfitRes?.ok) {
          const data = await outfitRes.json();
          setOutfits(data.outfits as OutfitSummary[]);
        } else {
          setOutfits([]);
        }

        if (itemRes?.ok) {
          const data = await itemRes.json();
          setItems(data.items as FavoriteItem[]);
        } else {
          setItems([]);
        }
      } catch {
        setOutfits([]);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading, initialOutfits, initialItems]);

  const totalCount = outfits.length + items.length;
  const isEmpty = totalCount === 0;
  const tabEmpty =
    viewMode === "outfit" ? outfits.length === 0 : items.length === 0;

  return (
    <div className="min-w-0">
      <div className="mb-4 sm:mb-5">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          {t("favorites.title")}
        </h1>
        {!loading && !authLoading && totalCount > 0 && (
          <p className="mt-1 text-sm text-muted">
            {t("favorites.totalCount", { count: totalCount })}
          </p>
        )}
      </div>

      {!isEmpty && (
        <div className="mb-5">
          <ViewModeTabs viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      )}

      {loading || authLoading ? (
        <p className="text-sm text-muted">{t("loading")}</p>
      ) : isEmpty ? (
        <div className="rounded-xl border border-dashed border-border bg-empty p-8 text-center sm:p-12">
          <p className="text-sm text-muted">{t("favorites.empty")}</p>
        </div>
      ) : tabEmpty ? (
        <div className="rounded-xl bg-empty p-8 text-center sm:p-12">
          <p className="text-sm text-muted">
            {viewMode === "outfit"
              ? t("home.noOutfits")
              : t("home.noItems")}
          </p>
        </div>
      ) : viewMode === "outfit" ? (
        <div className={GRID_CLASS}>
          {outfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              id={outfit.id}
              mainImage={outfit.mainImage}
              eventName={outfit.eventName}
              date={outfit.date}
              itemTypes={outfit.itemTypes}
            />
          ))}
        </div>
      ) : (
        <div className={GRID_CLASS}>
          {items.map((item) => (
            <ItemCard
              key={item.id}
              id={item.id}
              image={item.image}
              type={item.type}
              brand={item.brand}
              productName={item.productName}
              useCount={item.useCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
