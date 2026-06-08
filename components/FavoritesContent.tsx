"use client";

import Image from "next/image";
import Link from "next/link";
import { assetUrl } from "@/lib/asset-url";
import { cdnImageProps } from "@/lib/remote-image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider";
import OutfitCard from "./OutfitCard";
import {
  getFavoriteItemIds,
  getFavoriteOutfitIds,
} from "@/lib/favorites";
import type { OutfitSummary } from "./HomeContent";
import { normalizeItemType } from "@/lib/types";

type FavoriteItem = {
  id: string;
  type: string;
  brand: string | null;
  productName: string | null;
  image: string | null;
  outfitId: string;
  outfitTitle: string;
};

const PREVIEW_LIMIT = 8;

export default function FavoritesContent({
  initialOutfits = [],
  initialItems = [],
}: {
  initialOutfits?: OutfitSummary[];
  initialItems?: FavoriteItem[];
}) {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [outfits, setOutfits] = useState<OutfitSummary[]>(initialOutfits);
  const [items, setItems] = useState<FavoriteItem[]>(initialItems);
  const [loading, setLoading] = useState(
    initialOutfits.length === 0 && initialItems.length === 0
  );
  const [outfitsExpanded, setOutfitsExpanded] = useState(false);
  const [itemsExpanded, setItemsExpanded] = useState(false);

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

  const isEmpty = outfits.length === 0 && items.length === 0;
  const visibleOutfits = outfitsExpanded
    ? outfits
    : outfits.slice(0, PREVIEW_LIMIT);
  const visibleItems = itemsExpanded ? items : items.slice(0, PREVIEW_LIMIT);

  return (
    <div className="min-w-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-semibold text-neutral-900 sm:text-2xl">
          {t("favorites.title")}
        </h1>
      </div>

      {loading || authLoading ? (
        <p className="text-sm text-muted">{t("loading")}</p>
      ) : isEmpty ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center sm:p-12">
          <p className="text-sm text-muted">{t("favorites.empty")}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {outfits.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-neutral-700">
                {t("favorites.outfitsSection")}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {visibleOutfits.map((outfit) => (
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
              {outfits.length > PREVIEW_LIMIT && (
                <button
                  type="button"
                  onClick={() => setOutfitsExpanded((v) => !v)}
                  className="mt-3 cursor-pointer text-sm text-muted underline hover:text-neutral-900"
                >
                  {outfitsExpanded
                    ? t("favorites.collapse")
                    : t("favorites.expand")}
                </button>
              )}
            </section>
          )}

          {items.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-neutral-700">
                {t("favorites.itemsSection")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/outfit/${item.outfitId}`}
                    className="flex min-w-0 cursor-pointer gap-3 rounded-xl border border-border bg-white p-3 transition-shadow hover:shadow-sm"
                  >
                    {item.image ? (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-white">
                        <Image
                          src={assetUrl(item.image)}
                          alt={item.productName ?? item.type}
                          fill
                          className="object-contain"
                          sizes="64px"
                          loading="lazy"
                          {...cdnImageProps()}
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs text-muted">
                        {t(`itemTypes.${normalizeItemType(item.type)}`)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {item.brand && (
                        <p className="mt-1 text-xs font-medium text-neutral-500">
                          {item.brand}
                        </p>
                      )}
                      {item.productName && (
                        <p className="mt-0.5 break-words text-sm font-medium text-neutral-900">
                          {item.productName}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              {items.length > PREVIEW_LIMIT && (
                <button
                  type="button"
                  onClick={() => setItemsExpanded((v) => !v)}
                  className="mt-3 cursor-pointer text-sm text-muted underline hover:text-neutral-900"
                >
                  {itemsExpanded
                    ? t("favorites.collapse")
                    : t("favorites.expand")}
                </button>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
