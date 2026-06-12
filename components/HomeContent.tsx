"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ItemCard from "./ItemCard";
import OutfitCard from "./OutfitCard";
import HomeFilters from "./HomeFilters";
import type { ItemSummary } from "@/lib/item-summary";
import {
  getSavedViewMode,
  setSavedViewMode,
  type HomeViewMode,
} from "@/lib/home-view-mode";
import {
  getSavedLoadedCount,
  HOME_PAGE_SIZE,
  setSavedLoadedCount,
} from "@/lib/home-pagination";
import { getSavedFilters, setSavedFilters } from "@/lib/home-filters";
import { clearHomeScroll, getHomeScroll } from "@/lib/home-scroll";
import { getSavedSort, setSavedSort } from "@/lib/home-sort";
import {
  DEFAULT_OUTFIT_SORT,
  type OutfitSort,
} from "@/lib/outfit-sort";
import { matchesTypeFilter } from "@/lib/types";

export type OutfitSummary = {
  id: string;
  mainImage: string;
  eventName: string;
  date: string;
  itemTypes: string[];
  searchText: string;
};

type OutfitListData = {
  outfits: OutfitSummary[];
  total: number;
  hasMore: boolean;
};

type ItemListData = {
  items: ItemSummary[];
  total: number;
  hasMore: boolean;
};

type InitialData = {
  outfits?: OutfitListData;
  items?: ItemListData;
};

function dedupeOutfits(list: OutfitSummary[]): OutfitSummary[] {
  const seen = new Set<string>();
  return list.filter((o) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });
}

function dedupeItems(list: ItemSummary[]): ItemSummary[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function HomeContent({
  initialData,
}: {
  initialData?: InitialData;
}) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<HomeViewMode>("outfit");
  const [sort, setSort] = useState<OutfitSort>(DEFAULT_OUTFIT_SORT);
  const [outfits, setOutfits] = useState<OutfitSummary[]>(
    dedupeOutfits(initialData?.outfits?.outfits ?? [])
  );
  const [items, setItems] = useState<ItemSummary[]>(
    dedupeItems(initialData?.items?.items ?? [])
  );
  const [outfitTotal, setOutfitTotal] = useState(initialData?.outfits?.total ?? 0);
  const [itemTotal, setItemTotal] = useState(initialData?.items?.total ?? 0);
  const [outfitHasMore, setOutfitHasMore] = useState(
    initialData?.outfits?.hasMore ?? false
  );
  const [itemHasMore, setItemHasMore] = useState(
    initialData?.items?.hasMore ?? false
  );
  const hasOutfitInitial = Boolean(initialData?.outfits?.outfits?.length);
  const hasItemInitial = Boolean(initialData?.items?.items?.length);
  const [loading, setLoading] = useState(!hasOutfitInitial && !hasItemInitial);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [query, setQuery] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const initDoneRef = useRef(false);
  const filtersRestoredRef = useRef(false);
  const [pageReady, setPageReady] = useState(hasOutfitInitial || hasItemInitial);

  useEffect(() => {
    if (filtersRestoredRef.current) return;
    filtersRestoredRef.current = true;
    const saved = getSavedFilters();
    setTypeFilter(saved.typeFilter);
    setQuery(saved.query);
  }, []);

  const fetchOutfits = useCallback(
    async (offset: number, limit: number, nextSort: OutfitSort) => {
      const withTotal = offset === 0 ? "1" : "0";
      const res = await fetch(
        `/api/outfits/list?limit=${limit}&offset=${offset}&sort=${nextSort}&withTotal=${withTotal}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error();
      return data as OutfitListData;
    },
    []
  );

  const fetchItems = useCallback(
    async (offset: number, limit: number, nextSort: OutfitSort) => {
      const withTotal = offset === 0 ? "1" : "0";
      const res = await fetch(
        `/api/items/list?limit=${limit}&offset=${offset}&sort=${nextSort}&withTotal=${withTotal}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error();
      return data as ItemListData;
    },
    []
  );

  const reloadFromStart = useCallback(
    async (mode: HomeViewMode, nextSort: OutfitSort) => {
      setLoading(true);
      setPageReady(false);
      try {
        const savedLimit = getSavedLoadedCount();
        if (mode === "outfit") {
          const data = await fetchOutfits(0, savedLimit, nextSort);
          setOutfits(dedupeOutfits(data.outfits));
          setOutfitTotal(data.total);
          setOutfitHasMore(data.hasMore);
          setSavedLoadedCount(data.outfits.length);
        } else {
          const data = await fetchItems(0, savedLimit, nextSort);
          setItems(dedupeItems(data.items));
          setItemTotal(data.total);
          setItemHasMore(data.hasMore);
          setSavedLoadedCount(data.items.length);
        }
      } catch {
        if (mode === "outfit") {
          setOutfits([]);
          setOutfitTotal(0);
          setOutfitHasMore(false);
        } else {
          setItems([]);
          setItemTotal(0);
          setItemHasMore(false);
        }
      } finally {
        setLoading(false);
        setPageReady(true);
      }
    },
    [fetchItems, fetchOutfits]
  );

  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    async function init() {
      const savedSort = getSavedSort();
      const savedMode = getSavedViewMode();
      setSort(savedSort);
      setViewMode(savedMode);

      const savedLimit = getSavedLoadedCount();
      const canUseOutfitInitial =
        initialData?.outfits &&
        savedMode === "outfit" &&
        savedSort === DEFAULT_OUTFIT_SORT &&
        (initialData.outfits.outfits.length >= savedLimit ||
          savedLimit === HOME_PAGE_SIZE);

      const canUseItemInitial =
        initialData?.items &&
        savedMode === "item" &&
        savedSort === DEFAULT_OUTFIT_SORT &&
        (initialData.items.items.length >= savedLimit ||
          savedLimit === HOME_PAGE_SIZE);

      if (canUseOutfitInitial) {
        setOutfits(dedupeOutfits(initialData.outfits!.outfits));
        setOutfitTotal(initialData.outfits!.total);
        setOutfitHasMore(initialData.outfits!.hasMore);
        setSavedLoadedCount(initialData.outfits!.outfits.length);
        setLoading(false);
        setPageReady(true);
        return;
      }

      if (canUseItemInitial) {
        setItems(dedupeItems(initialData.items!.items));
        setItemTotal(initialData.items!.total);
        setItemHasMore(initialData.items!.hasMore);
        setSavedLoadedCount(initialData.items!.items.length);
        setLoading(false);
        setPageReady(true);
        return;
      }

      await reloadFromStart(savedMode, savedSort);
    }

    init();
  }, [fetchItems, fetchOutfits, initialData, reloadFromStart]);

  useEffect(() => {
    if (!pageReady) return;
    const y = getHomeScroll();
    if (y <= 0) return;

    const restore = () => window.scrollTo(0, y);
    restore();
    const raf = requestAnimationFrame(restore);
    const timer = setTimeout(() => {
      restore();
      clearHomeScroll();
    }, 200);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [pageReady, outfits.length, items.length, typeFilter, query]);

  const hasMore = viewMode === "outfit" ? outfitHasMore : itemHasMore;
  const listLength = viewMode === "outfit" ? outfits.length : items.length;
  const total = viewMode === "outfit" ? outfitTotal : itemTotal;

  const loadMore = useCallback(async () => {
    if (loading || loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      if (viewMode === "outfit") {
        const data = await fetchOutfits(outfits.length, HOME_PAGE_SIZE, sort);
        setOutfits((prev) => {
          const next = dedupeOutfits([...prev, ...data.outfits]);
          setSavedLoadedCount(next.length);
          return next;
        });
        if (data.total > 0) setOutfitTotal(data.total);
        setOutfitHasMore(data.hasMore);
      } else {
        const data = await fetchItems(items.length, HOME_PAGE_SIZE, sort);
        setItems((prev) => {
          const next = dedupeItems([...prev, ...data.items]);
          setSavedLoadedCount(next.length);
          return next;
        });
        if (data.total > 0) setItemTotal(data.total);
        setItemHasMore(data.hasMore);
      }
    } catch {
      /* ignore */
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [
    fetchItems,
    fetchOutfits,
    hasMore,
    items.length,
    loading,
    outfits.length,
    sort,
    viewMode,
  ]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loading]);

  function handleSortChange(nextSort: OutfitSort) {
    if (nextSort === sort) return;
    setSort(nextSort);
    setSavedSort(nextSort);
    void reloadFromStart(viewMode, nextSort);
  }

  function handleViewModeChange(nextMode: HomeViewMode) {
    if (nextMode === viewMode) return;
    setViewMode(nextMode);
    setSavedViewMode(nextMode);
    void reloadFromStart(nextMode, sort);
  }

  function handleTypeFilterChange(next: string) {
    setTypeFilter(next);
    setSavedFilters({ typeFilter: next, query });
  }

  function handleQueryChange(next: string) {
    setQuery(next);
    setSavedFilters({ typeFilter, query: next });
  }

  const filteredOutfits = useMemo(() => {
    const q = query.trim().toLowerCase();
    return outfits.filter((outfit) => {
      if (
        typeFilter &&
        !outfit.itemTypes.some((type) => matchesTypeFilter(type, typeFilter))
      ) {
        return false;
      }
      if (q && !outfit.searchText.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [outfits, typeFilter, query]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter && !matchesTypeFilter(item.type, typeFilter)) {
        return false;
      }
      if (q && !item.searchText.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, typeFilter, query]);

  const filtered =
    viewMode === "outfit" ? filteredOutfits : filteredItems;

  const resultCount = useMemo(() => {
    if (typeFilter || query.trim()) return filtered.length;
    const serverTotal = viewMode === "outfit" ? outfitTotal : itemTotal;
    return serverTotal > 0 ? serverTotal : filtered.length;
  }, [
    filtered.length,
    itemTotal,
    outfitTotal,
    query,
    typeFilter,
    viewMode,
  ]);

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

      {loading ? (
        <div className="py-6 text-center">
          <span className="inline-flex items-center gap-2 text-sm text-muted">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" aria-hidden />
            {t("loading")}
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-empty p-8 text-center sm:p-12">
          <p className="text-sm text-muted">
            {viewMode === "outfit"
              ? t("home.noOutfits")
              : t("home.noItems")}
          </p>
        </div>
      ) : (
        <>
          <div
            className={
              viewMode === "outfit"
                ? "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4"
                : "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4"
            }
          >
            {viewMode === "outfit"
              ? filteredOutfits.map((outfit) => (
                  <OutfitCard
                    key={outfit.id}
                    id={outfit.id}
                    mainImage={outfit.mainImage}
                    eventName={outfit.eventName}
                    date={outfit.date}
                    itemTypes={outfit.itemTypes}
                  />
                ))
              : filteredItems.map((item) => (
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
          {hasMore && (
            <div ref={sentinelRef} className="py-6 text-center text-xs text-muted">
              {loadingMore ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" aria-hidden />
                  {t("loading")}
                </span>
              ) : t("home.loadMore")}
            </div>
          )}
        </>
      )}
    </div>
  );
}
