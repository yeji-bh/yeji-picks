"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider";
import OutfitCard from "./OutfitCard";
import ItemCard from "./ItemCard";
import NailArtCard from "./NailArtCard";
import NailArtMasonry from "./NailArtMasonry";
import PhoneCaseCard from "./PhoneCaseCard";
import ViewModeTabs from "./ViewModeTabs";
import {
  getFavoriteItemIds,
  getFavoriteNailArtIds,
  getFavoriteOutfitIds,
  getFavoritePhoneCaseIds,
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

type FavoriteNailArt = {
  id: string;
  image: string;
};

type FavoritePhoneCase = {
  id: string;
  image: string;
  brand: string;
  model: string;
  officialLink: string;
};

const GRID_CLASS =
  "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4";

const FAVORITE_MODES: HomeViewMode[] = [
  "outfit",
  "item",
  "nailArt",
  "phoneCase",
];

export default function FavoritesContent({
  initialOutfits = [],
  initialItems = [],
  initialNailArts = [],
  initialPhoneCases = [],
}: {
  initialOutfits?: OutfitSummary[];
  initialItems?: FavoriteItem[];
  initialNailArts?: FavoriteNailArt[];
  initialPhoneCases?: FavoritePhoneCase[];
}) {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<HomeViewMode>("outfit");
  const [outfits, setOutfits] = useState<OutfitSummary[]>(initialOutfits);
  const [items, setItems] = useState<FavoriteItem[]>(initialItems);
  const [nailArts, setNailArts] = useState<FavoriteNailArt[]>(initialNailArts);
  const [phoneCases, setPhoneCases] =
    useState<FavoritePhoneCase[]>(initialPhoneCases);
  const [loading, setLoading] = useState(
    initialOutfits.length === 0 &&
      initialItems.length === 0 &&
      initialNailArts.length === 0 &&
      initialPhoneCases.length === 0
  );

  useEffect(() => {
    if (authLoading) return;

    if (
      user &&
      (initialOutfits.length > 0 ||
        initialItems.length > 0 ||
        initialNailArts.length > 0 ||
        initialPhoneCases.length > 0)
    ) {
      setOutfits(initialOutfits);
      setItems(initialItems);
      setNailArts(initialNailArts);
      setPhoneCases(initialPhoneCases);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const outfitIds = getFavoriteOutfitIds();
        const itemIds = getFavoriteItemIds();
        const nailArtIds = getFavoriteNailArtIds();
        const phoneCaseIds = getFavoritePhoneCaseIds();

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

        const nailArtUrl = user
          ? "/api/favorites/nail-arts"
          : nailArtIds.length > 0
            ? `/api/favorites/nail-arts?ids=${nailArtIds.join(",")}`
            : null;

        const phoneCaseUrl = user
          ? "/api/favorites/phone-cases"
          : phoneCaseIds.length > 0
            ? `/api/favorites/phone-cases?ids=${phoneCaseIds.join(",")}`
            : null;

        const [outfitRes, itemRes, nailArtRes, phoneCaseRes] = await Promise.all([
          outfitUrl ? fetch(outfitUrl) : null,
          itemUrl ? fetch(itemUrl) : null,
          nailArtUrl ? fetch(nailArtUrl) : null,
          phoneCaseUrl ? fetch(phoneCaseUrl) : null,
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

        if (nailArtRes?.ok) {
          const data = await nailArtRes.json();
          setNailArts(data.nailArts as FavoriteNailArt[]);
        } else {
          setNailArts([]);
        }

        if (phoneCaseRes?.ok) {
          const data = await phoneCaseRes.json();
          setPhoneCases(data.phoneCases as FavoritePhoneCase[]);
        } else {
          setPhoneCases([]);
        }
      } catch {
        setOutfits([]);
        setItems([]);
        setNailArts([]);
        setPhoneCases([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [
    user,
    authLoading,
    initialOutfits,
    initialItems,
    initialNailArts,
    initialPhoneCases,
  ]);

  const totalCount =
    outfits.length + items.length + nailArts.length + phoneCases.length;
  const isEmpty = totalCount === 0;
  const tabEmpty =
    viewMode === "outfit"
      ? outfits.length === 0
      : viewMode === "item"
        ? items.length === 0
        : viewMode === "nailArt"
          ? nailArts.length === 0
          : phoneCases.length === 0;

  const emptyMessageKey =
    viewMode === "outfit"
      ? "home.noOutfits"
      : viewMode === "item"
        ? "home.noItems"
        : viewMode === "nailArt"
          ? "home.noNailArts"
          : "home.noPhoneCases";

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
          <ViewModeTabs
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            modes={FAVORITE_MODES}
          />
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
          <p className="text-sm text-muted">{t(emptyMessageKey)}</p>
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
      ) : viewMode === "item" ? (
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
      ) : viewMode === "nailArt" ? (
        <NailArtMasonry>
          {nailArts.map((nailArt) => (
            <NailArtCard
              key={nailArt.id}
              id={nailArt.id}
              image={nailArt.image}
            />
          ))}
        </NailArtMasonry>
      ) : (
        <div className={GRID_CLASS}>
          {phoneCases.map((phoneCase) => (
            <PhoneCaseCard
              key={phoneCase.id}
              id={phoneCase.id}
              image={phoneCase.image}
              brand={phoneCase.brand}
              model={phoneCase.model}
              officialLink={phoneCase.officialLink}
            />
          ))}
        </div>
      )}
    </div>
  );
}
