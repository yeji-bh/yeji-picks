"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import HomeGridSkeleton from "./HomeGridSkeleton";
import ItemCard from "./ItemCard";
import NailArtCard from "./NailArtCard";
import NailArtMasonry from "./NailArtMasonry";
import OutfitCard from "./OutfitCard";
import PhoneCaseCard from "./PhoneCaseCard";
import PerfumeListItem from "./PerfumeListItem";
import GalleryProductCard from "./GalleryProductCard";
import HomeFilters from "./HomeFilters";
import type { ItemSummary } from "@/lib/item-summary";
import type { NailArtSummary } from "@/lib/nail-arts-list";
import type { PhoneCaseSummary } from "@/lib/phone-cases-list";
import type { PerfumeSummary } from "@/lib/perfumes-list";
import type { GalleryProductSummary } from "@/lib/gallery-product-list";
import {
  getSavedViewMode,
  setSavedViewMode,
  type HomeViewMode,
} from "@/lib/home-view-mode";
import { getSavedFilters, setSavedFilters } from "@/lib/home-filters";
import { clearHomeScroll, getHomeScroll, restoreHomeScroll } from "@/lib/home-scroll";
import { getSavedSort, setSavedSort, type HomeSort } from "@/lib/home-sort";
import { DEFAULT_OUTFIT_SORT } from "@/lib/outfit-sort";
import type { Locale } from "@/lib/i18n/settings";
import { isGridLcpCandidate } from "@/lib/grid-image";
import {
  buildHomeFeedKey,
  useHomeFeed,
  type FeedPage,
} from "@/lib/use-home-feed";

export type OutfitSummary = {
  id: string;
  mainImage: string;
  eventName: string;
  date: string;
  itemTypes: string[];
  searchText: string;
};

type InitialData = {
  outfits?: FeedPage<OutfitSummary>;
  items?: FeedPage<ItemSummary>;
  nailArts?: FeedPage<NailArtSummary>;
  phoneCases?: FeedPage<PhoneCaseSummary>;
};

function useSentinelLoadMore(
  loadMore: () => void | Promise<void>,
  enabled: boolean,
  resetKey: string
) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !enabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void loadMoreRef.current();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, resetKey]);

  return sentinelRef;
}

function feedQueryForMode(mode: HomeViewMode, query: string): string {
  if (mode === "nailArt") return "";
  return query;
}

function feedTypeFilterForMode(mode: HomeViewMode, typeFilter: string): string {
  if (mode === "outfit" || mode === "item") return typeFilter;
  return "";
}

export default function HomeContent({
  initialLocale,
  initialData,
}: {
  initialLocale: Locale;
  initialData?: InitialData;
}) {
  const { t, i18n } = useTranslation();
  const pendingScrollYRef = useRef(0);
  const prefsRestoredRef = useRef(false);

  const [viewMode, setViewMode] = useState<HomeViewMode>("outfit");
  const [sort, setSort] = useState<HomeSort>(DEFAULT_OUTFIT_SORT);
  const [typeFilter, setTypeFilter] = useState("");
  const [query, setQuery] = useState("");
  const [prefsReady, setPrefsReady] = useState(false);
  const [pageReady] = useState(true);

  useLayoutEffect(() => {
    if (prefsRestoredRef.current) return;
    prefsRestoredRef.current = true;
    const savedMode = getSavedViewMode();
    setViewMode(savedMode);
    setSort(getSavedSort(savedMode));
    const saved = getSavedFilters();
    setTypeFilter(saved.typeFilter);
    setQuery(saved.query);
    setPrefsReady(true);
  }, []);

  const feedTypeFilter = feedTypeFilterForMode(viewMode, typeFilter);
  const feedQuery = feedQueryForMode(viewMode, query);

  const outfitSeedKey = buildHomeFeedKey(
    "outfit",
    DEFAULT_OUTFIT_SORT,
    "",
    "",
    initialLocale
  );

  const canUseOutfitSeed =
    prefsReady &&
    viewMode === "outfit" &&
    sort === DEFAULT_OUTFIT_SORT &&
    !feedTypeFilter &&
    !feedQuery.trim();

  const feed = useHomeFeed<
    | OutfitSummary
    | ItemSummary
    | NailArtSummary
    | PhoneCaseSummary
    | PerfumeSummary
    | GalleryProductSummary
  >({
    mode: viewMode,
    sort,
    typeFilter: feedTypeFilter,
    query: feedQuery,
    locale: i18n.language,
    seed: canUseOutfitSeed ? (initialData?.outfits ?? null) : null,
    seedKey: outfitSeedKey,
    prefsReady,
  });

  const { items, total, hasMore, loading, loadingMore, loadMore, feedKey } =
    feed;

  const sentinelEnabled = pageReady && hasMore && !loading && !loadingMore;
  const sentinelRef = useSentinelLoadMore(
    loadMore,
    sentinelEnabled,
    `${feedKey}:${items.length}`
  );

  useEffect(() => {
    if (!pageReady) return;
    const y = getHomeScroll();
    if (y <= 0) {
      pendingScrollYRef.current = 0;
      return;
    }
    pendingScrollYRef.current = y;
  }, [pageReady, feedKey]);

  useLayoutEffect(() => {
    if (!pageReady || loading) return;
    const y = pendingScrollYRef.current;
    if (y <= 0) return;
    restoreHomeScroll(y);
    pendingScrollYRef.current = 0;
  }, [pageReady, loading, items.length, feedKey]);

  const handleViewModeChange = useCallback((nextMode: HomeViewMode) => {
    if (nextMode === viewMode) return;
    pendingScrollYRef.current = 0;
    clearHomeScroll();
    setViewMode(nextMode);
    setSavedViewMode(nextMode);
    setSort(getSavedSort(nextMode));
    setTypeFilter("");
    setQuery("");
    setSavedFilters({ typeFilter: "", query: "" });
  }, [viewMode]);

  const handleSortChange = useCallback(
    (nextSort: HomeSort) => {
      if (nextSort === sort) return;
      setSort(nextSort);
      setSavedSort(nextSort, viewMode);
    },
    [sort, viewMode]
  );

  const handleTypeFilterChange = useCallback(
    (next: string) => {
      setTypeFilter(next);
      setSavedFilters({ typeFilter: next, query });
    },
    [query]
  );

  const handleQueryChange = useCallback(
    (next: string) => {
      setQuery(next);
      setSavedFilters({ typeFilter, query: next });
    },
    [typeFilter]
  );

  const isFiltering =
    (viewMode === "outfit" || viewMode === "item") &&
    Boolean(typeFilter || query.trim());
  const resultCount =
    !prefsReady || loading
      ? undefined
      : total > 0
        ? total
        : items.length;

  const emptyMessageKey =
    isFiltering && items.length === 0
      ? "home.noFilterMatches"
      : viewMode === "outfit"
        ? "home.noOutfits"
        : viewMode === "item"
          ? "home.noItems"
          : viewMode === "nailArt"
            ? "home.noNailArts"
            : viewMode === "phoneCase"
              ? "home.noPhoneCases"
              : viewMode === "perfume"
                ? "home.noPerfumes"
                : viewMode === "lovedItem"
                  ? "home.noLovedItems"
                  : "home.noCosmetics";

  const gridClass =
    "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4";

  return (
    <div className="min-w-0">
      <HomeFilters
        viewMode={viewMode}
        typeFilter={typeFilter}
        query={query}
        sort={sort}
        resultCount={resultCount}
        onViewModeChange={handleViewModeChange}
        onTypeChange={handleTypeFilterChange}
        onQueryChange={handleQueryChange}
        onSortChange={handleSortChange}
      />

      {loading || !prefsReady ? (
        <HomeGridSkeleton />
      ) : items.length === 0 ? (
        <>
          <div className="rounded-xl bg-empty p-8 text-center sm:p-12">
            <p className="text-sm text-muted">{t(emptyMessageKey)}</p>
          </div>
          {hasMore && <div ref={sentinelRef} className="h-px" aria-hidden />}
        </>
      ) : (
        <>
          {viewMode === "nailArt" ? (
            <NailArtMasonry>
              {(items as NailArtSummary[]).map((nailArt, index) => (
                <NailArtCard
                  key={nailArt.id}
                  id={nailArt.id}
                  image={nailArt.image}
                  priority={isGridLcpCandidate(index)}
                />
              ))}
            </NailArtMasonry>
          ) : viewMode === "perfume" ? (
            <div className="divide-y divide-border">
              {(items as PerfumeSummary[]).map((perfume, index) => (
                <PerfumeListItem
                  key={perfume.id}
                  id={perfume.id}
                  image={perfume.image}
                  name={perfume.name}
                  brand={perfume.brand}
                  description={perfume.description}
                  officialLink={perfume.officialLink}
                  priority={isGridLcpCandidate(index)}
                  imageQuality={72}
                />
              ))}
            </div>
          ) : viewMode === "lovedItem" || viewMode === "cosmetic" ? (
            <div className={gridClass}>
              {(items as GalleryProductSummary[]).map((product, index) => (
                <GalleryProductCard
                  key={product.id}
                  image={product.image}
                  name={product.name}
                  brand={product.brand}
                  officialLink={product.officialLink}
                  priority={isGridLcpCandidate(index)}
                  imageQuality={72}
                />
              ))}
            </div>
          ) : (
            <div className={gridClass}>
              {viewMode === "outfit"
                ? (items as OutfitSummary[]).map((outfit, index) => (
                    <OutfitCard
                      key={outfit.id}
                      id={outfit.id}
                      mainImage={outfit.mainImage}
                      eventName={outfit.eventName}
                      date={outfit.date}
                      itemTypes={outfit.itemTypes}
                      priority={isGridLcpCandidate(index)}
                      imageQuality={72}
                    />
                  ))
                : viewMode === "item"
                  ? (items as ItemSummary[]).map((item, index) => (
                      <ItemCard
                        key={item.id}
                        id={item.id}
                        image={item.image}
                        type={item.type}
                        brand={item.brand}
                        productName={item.productName}
                        useCount={item.useCount}
                        priority={isGridLcpCandidate(index)}
                        imageQuality={72}
                      />
                    ))
                  : viewMode === "phoneCase"
                    ? (items as PhoneCaseSummary[]).map((phoneCase, index) => (
                        <PhoneCaseCard
                          key={phoneCase.id}
                          id={phoneCase.id}
                          image={phoneCase.image}
                          brand={phoneCase.brand}
                          model={phoneCase.model}
                          officialLink={phoneCase.officialLink}
                          priority={isGridLcpCandidate(index)}
                          imageQuality={72}
                        />
                      ))
                    : null}
            </div>
          )}
          {hasMore && (
            <div
              ref={sentinelRef}
              className="py-6 text-center text-xs text-muted"
            >
              {loadingMore ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700"
                    aria-hidden
                  />
                  {t("loading")}
                </span>
              ) : (
                t("home.loadMore")
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
