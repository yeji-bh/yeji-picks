"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import HomeGridSkeleton from "./HomeGridSkeleton";
import ItemCard from "./ItemCard";
import NailArtCard from "./NailArtCard";
import NailArtMasonry from "./NailArtMasonry";
import OutfitCard from "./OutfitCard";
import PhoneCaseCard from "./PhoneCaseCard";
import HomeFilters from "./HomeFilters";
import type { ItemSummary } from "@/lib/item-summary";
import type { NailArtSummary } from "@/lib/nail-arts-list";
import type { PhoneCaseSummary } from "@/lib/phone-cases-list";
import {
  getSavedViewMode,
  setSavedViewMode,
  type HomeViewMode,
} from "@/lib/home-view-mode";
import {
  getSavedLoadedCount,
  HOME_INITIAL_RENDER,
  HOME_PAGE_SIZE,
  setSavedLoadedCount,
} from "@/lib/home-pagination";
import { getSavedFilters, setSavedFilters } from "@/lib/home-filters";
import { clearHomeScroll, getHomeScroll, restoreHomeScroll } from "@/lib/home-scroll";
import { getSavedSort, setSavedSort, type HomeSort } from "@/lib/home-sort";
import {
  DEFAULT_OUTFIT_SORT,
} from "@/lib/outfit-sort";
import { matchesTypeFilter } from "@/lib/types";
import { isGridLcpCandidate } from "@/lib/grid-image";

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

type NailArtListData = {
  nailArts: NailArtSummary[];
  total: number;
  hasMore: boolean;
};

type PhoneCaseListData = {
  phoneCases: PhoneCaseSummary[];
  total: number;
  hasMore: boolean;
};

type InitialData = {
  outfits?: OutfitListData;
  items?: ItemListData;
  nailArts?: NailArtListData;
  phoneCases?: PhoneCaseListData;
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

function dedupeNailArts(list: NailArtSummary[]): NailArtSummary[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function dedupePhoneCases(list: PhoneCaseSummary[]): PhoneCaseSummary[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function getModeRawCount(
  mode: HomeViewMode,
  lists: {
    outfits: OutfitSummary[];
    items: ItemSummary[];
    nailArts: NailArtSummary[];
    phoneCases: PhoneCaseSummary[];
  }
): number {
  switch (mode) {
    case "outfit":
      return lists.outfits.length;
    case "item":
      return lists.items.length;
    case "nailArt":
      return lists.nailArts.length;
    case "phoneCase":
      return lists.phoneCases.length;
  }
}

export default function HomeContent({
  initialData,
}: {
  initialData?: InitialData;
}) {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState<HomeViewMode>("outfit");
  const [sort, setSort] = useState<HomeSort>(DEFAULT_OUTFIT_SORT);
  const [outfits, setOutfits] = useState<OutfitSummary[]>(
    dedupeOutfits(initialData?.outfits?.outfits ?? [])
  );
  const [items, setItems] = useState<ItemSummary[]>(
    dedupeItems(initialData?.items?.items ?? [])
  );
  const [nailArts, setNailArts] = useState<NailArtSummary[]>(
    dedupeNailArts(initialData?.nailArts?.nailArts ?? [])
  );
  const [phoneCases, setPhoneCases] = useState<PhoneCaseSummary[]>(
    dedupePhoneCases(initialData?.phoneCases?.phoneCases ?? [])
  );
  const [outfitTotal, setOutfitTotal] = useState(initialData?.outfits?.total ?? 0);
  const [itemTotal, setItemTotal] = useState(initialData?.items?.total ?? 0);
  const [nailArtTotal, setNailArtTotal] = useState(initialData?.nailArts?.total ?? 0);
  const [phoneCaseTotal, setPhoneCaseTotal] = useState(
    initialData?.phoneCases?.total ?? 0
  );
  const [outfitHasMore, setOutfitHasMore] = useState(
    initialData?.outfits?.hasMore ?? false
  );
  const [itemHasMore, setItemHasMore] = useState(
    initialData?.items?.hasMore ?? false
  );
  const [nailArtHasMore, setNailArtHasMore] = useState(
    initialData?.nailArts?.hasMore ?? false
  );
  const [phoneCaseHasMore, setPhoneCaseHasMore] = useState(
    initialData?.phoneCases?.hasMore ?? false
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [query, setQuery] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const initDoneRef = useRef(false);
  const filtersRestoredRef = useRef(false);
  const loadedModesRef = useRef<Set<HomeViewMode>>(new Set());
  const pendingScrollYRef = useRef(0);
  const filterLoadAttemptsRef = useRef(0);
  const prevPathRef = useRef<string | null>(null);
  const [filterSearchExhausted, setFilterSearchExhausted] = useState(false);
  const MAX_FILTER_LOAD_ATTEMPTS = 12;
  const [pageReady, setPageReady] = useState(false);
  const [renderLimit, setRenderLimit] = useState(HOME_INITIAL_RENDER);
  const renderSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (filtersRestoredRef.current) return;
    filtersRestoredRef.current = true;
    const saved = getSavedFilters();
    setTypeFilter(saved.typeFilter);
    setQuery(saved.query);
  }, []);

  const fetchOutfits = useCallback(
    async (offset: number, limit: number, nextSort: HomeSort) => {
      const withTotal = offset === 0 ? "1" : "0";
      const res = await fetch(
        `/api/outfits/list?limit=${limit}&offset=${offset}&sort=${nextSort}&withTotal=${withTotal}&locale=${encodeURIComponent(i18n.language)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error();
      return data as OutfitListData;
    },
    [i18n.language]
  );

  const fetchItems = useCallback(
    async (offset: number, limit: number, nextSort: HomeSort) => {
      const withTotal = offset === 0 ? "1" : "0";
      const res = await fetch(
        `/api/items/list?limit=${limit}&offset=${offset}&sort=${nextSort}&withTotal=${withTotal}&locale=${encodeURIComponent(i18n.language)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error();
      return data as ItemListData;
    },
    [i18n.language]
  );

  const fetchNailArts = useCallback(
    async (offset: number, limit: number, nextSort: HomeSort) => {
      const withTotal = offset === 0 ? "1" : "0";
      const res = await fetch(
        `/api/nail-arts/list?limit=${limit}&offset=${offset}&sort=${nextSort}&withTotal=${withTotal}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error();
      return data as NailArtListData;
    },
    []
  );

  const fetchPhoneCases = useCallback(
    async (offset: number, limit: number, nextSort: HomeSort) => {
      const withTotal = offset === 0 ? "1" : "0";
      const res = await fetch(
        `/api/phone-cases/list?limit=${limit}&offset=${offset}&sort=${nextSort}&withTotal=${withTotal}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error();
      return data as PhoneCaseListData;
    },
    []
  );

  const ensureModeLoaded = useCallback(
    async (
      mode: HomeViewMode,
      nextSort: HomeSort,
      options?: { force?: boolean }
    ) => {
      const lists = { outfits, items, nailArts, phoneCases };
      const rawCount = getModeRawCount(mode, lists);
      const alreadyLoaded = loadedModesRef.current.has(mode);
      if (alreadyLoaded && !options?.force) {
        if (rawCount > 0) {
          setLoading(false);
          setPageReady(true);
          return;
        }
        loadedModesRef.current.delete(mode);
      }

      setLoading(true);
      setPageReady(false);

      const limit =
        alreadyLoaded && options?.force
          ? getSavedLoadedCount()
          : HOME_PAGE_SIZE;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (mode === "outfit") {
            const data = await fetchOutfits(0, limit, nextSort);
            setOutfits(dedupeOutfits(data.outfits));
            setOutfitTotal(data.total);
            setOutfitHasMore(data.hasMore);
            setSavedLoadedCount(data.outfits.length);
          } else if (mode === "item") {
            const data = await fetchItems(0, limit, nextSort);
            setItems(dedupeItems(data.items));
            setItemTotal(data.total);
            setItemHasMore(data.hasMore);
            setSavedLoadedCount(data.items.length);
          } else if (mode === "nailArt") {
            const data = await fetchNailArts(0, limit, nextSort);
            setNailArts(dedupeNailArts(data.nailArts));
            setNailArtTotal(data.total);
            setNailArtHasMore(data.hasMore);
            setSavedLoadedCount(data.nailArts.length);
          } else {
            const data = await fetchPhoneCases(0, limit, nextSort);
            setPhoneCases(dedupePhoneCases(data.phoneCases));
            setPhoneCaseTotal(data.total);
            setPhoneCaseHasMore(data.hasMore);
            setSavedLoadedCount(data.phoneCases.length);
          }

          loadedModesRef.current.add(mode);
          setLoading(false);
          setPageReady(true);
          return;
        } catch {
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 400));
            continue;
          }
          if (mode === "outfit") {
            setOutfits([]);
            setOutfitTotal(0);
            setOutfitHasMore(false);
          } else if (mode === "item") {
            setItems([]);
            setItemTotal(0);
            setItemHasMore(false);
          } else if (mode === "nailArt") {
            setNailArts([]);
            setNailArtTotal(0);
            setNailArtHasMore(false);
          } else {
            setPhoneCases([]);
            setPhoneCaseTotal(0);
            setPhoneCaseHasMore(false);
          }
          loadedModesRef.current.delete(mode);
        }
      }

      setLoading(false);
      setPageReady(true);
    },
    [
      fetchItems,
      fetchNailArts,
      fetchOutfits,
      fetchPhoneCases,
      outfits,
      items,
      nailArts,
      phoneCases,
    ]
  );

  useLayoutEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    async function init() {
      const savedMode = getSavedViewMode();
      const savedSort = getSavedSort(savedMode);
      setSort(savedSort);
      setViewMode(savedMode);

      if (initialData?.outfits?.outfits?.length) {
        loadedModesRef.current.add("outfit");
      }

      const canUseOutfitInitial =
        initialData?.outfits &&
        savedMode === "outfit" &&
        savedSort === DEFAULT_OUTFIT_SORT;

      if (canUseOutfitInitial && initialData.outfits!.outfits.length > 0) {
        setOutfits(dedupeOutfits(initialData.outfits!.outfits));
        setOutfitTotal(initialData.outfits!.total);
        setOutfitHasMore(initialData.outfits!.hasMore);
        setLoading(false);
        setPageReady(true);
        setSavedLoadedCount(initialData.outfits!.outfits.length);

        const savedLimit = getSavedLoadedCount();
        if (savedLimit > initialData.outfits!.outfits.length) {
          void fetchOutfits(0, savedLimit, savedSort)
            .then((data) => {
              setOutfits(dedupeOutfits(data.outfits));
              setOutfitTotal(data.total);
              setOutfitHasMore(data.hasMore);
              setSavedLoadedCount(data.outfits.length);
            })
            .catch(() => {
              /* keep SSR batch */
            });
        }
        return;
      }

      if (
        savedMode === "outfit" &&
        loadedModesRef.current.has("outfit") &&
        savedSort === DEFAULT_OUTFIT_SORT &&
        outfits.length > 0
      ) {
        setLoading(false);
        setPageReady(true);
        return;
      }

      await ensureModeLoaded(savedMode, savedSort);
    }

    init();
  }, [ensureModeLoaded, fetchOutfits, initialData, outfits.length]);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;
    if (pathname !== "/" || prev === "/" || prev === null) return;

    const mode = getSavedViewMode();
    const savedSort = getSavedSort(mode);
    const rawCount = getModeRawCount(mode, {
      outfits,
      items,
      nailArts,
      phoneCases,
    });
    if (rawCount === 0) {
      loadedModesRef.current.delete(mode);
      void ensureModeLoaded(mode, savedSort, { force: true });
    }
  }, [pathname, ensureModeLoaded, outfits, items, nailArts, phoneCases]);

  const hasMore =
    viewMode === "outfit"
      ? outfitHasMore
      : viewMode === "item"
        ? itemHasMore
        : viewMode === "nailArt"
          ? nailArtHasMore
          : phoneCaseHasMore;
  const total =
    viewMode === "outfit"
      ? outfitTotal
      : viewMode === "item"
        ? itemTotal
        : viewMode === "nailArt"
          ? nailArtTotal
          : phoneCaseTotal;

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
      } else if (viewMode === "item") {
        const data = await fetchItems(items.length, HOME_PAGE_SIZE, sort);
        setItems((prev) => {
          const next = dedupeItems([...prev, ...data.items]);
          setSavedLoadedCount(next.length);
          return next;
        });
        if (data.total > 0) setItemTotal(data.total);
        setItemHasMore(data.hasMore);
      } else if (viewMode === "nailArt") {
        const data = await fetchNailArts(nailArts.length, HOME_PAGE_SIZE, sort);
        setNailArts((prev) => {
          const next = dedupeNailArts([...prev, ...data.nailArts]);
          setSavedLoadedCount(next.length);
          return next;
        });
        if (data.total > 0) setNailArtTotal(data.total);
        setNailArtHasMore(data.hasMore);
      } else {
        const data = await fetchPhoneCases(phoneCases.length, HOME_PAGE_SIZE, sort);
        setPhoneCases((prev) => {
          const next = dedupePhoneCases([...prev, ...data.phoneCases]);
          setSavedLoadedCount(next.length);
          return next;
        });
        if (data.total > 0) setPhoneCaseTotal(data.total);
        setPhoneCaseHasMore(data.hasMore);
      }
    } catch {
      /* ignore */
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [
    fetchItems,
    fetchNailArts,
    fetchOutfits,
    fetchPhoneCases,
    hasMore,
    items.length,
    loading,
    nailArts.length,
    outfits.length,
    phoneCases.length,
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

  function handleSortChange(nextSort: HomeSort) {
    if (nextSort === sort) return;
    setSort(nextSort);
    setSavedSort(nextSort, viewMode);
    void ensureModeLoaded(viewMode, nextSort, { force: true });
  }

  function handleViewModeChange(nextMode: HomeViewMode) {
    if (nextMode === viewMode) return;
    pendingScrollYRef.current = 0;
    clearHomeScroll();
    setViewMode(nextMode);
    setSavedViewMode(nextMode);
    const nextSort = getSavedSort(nextMode);
    setSort(nextSort);
    const rawCount = getModeRawCount(nextMode, {
      outfits,
      items,
      nailArts,
      phoneCases,
    });
    if (loadedModesRef.current.has(nextMode) && rawCount > 0) {
      setLoading(false);
      setPageReady(true);
      return;
    }
    if (loadedModesRef.current.has(nextMode)) {
      loadedModesRef.current.delete(nextMode);
    }
    void ensureModeLoaded(nextMode, nextSort);
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

  const filteredPhoneCases = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return phoneCases;
    return phoneCases.filter((item) =>
      item.searchText.toLowerCase().includes(q)
    );
  }, [phoneCases, query]);

  const activeList =
    viewMode === "outfit"
      ? filteredOutfits
      : viewMode === "item"
        ? filteredItems
        : viewMode === "nailArt"
          ? nailArts
          : filteredPhoneCases;
  const isFiltering =
    (viewMode === "outfit" || viewMode === "item") &&
    Boolean(typeFilter || query.trim());
  const awaitingFilterMatch =
    isFiltering &&
    activeList.length === 0 &&
    hasMore &&
    !filterSearchExhausted;
  const visibleOutfits = filteredOutfits.slice(0, renderLimit);
  const visibleItems = filteredItems.slice(0, renderLimit);
  const visibleNailArts = nailArts.slice(0, renderLimit);
  const visiblePhoneCases = filteredPhoneCases.slice(0, renderLimit);
  const canExpandRender = renderLimit < activeList.length;

  useEffect(() => {
    setRenderLimit(HOME_INITIAL_RENDER);
  }, [viewMode, sort, typeFilter, query]);

  useEffect(() => {
    if (!pageReady) return;
    const y = getHomeScroll();
    if (y <= 0) {
      pendingScrollYRef.current = 0;
      return;
    }
    pendingScrollYRef.current = y;
    if (activeList.length > 0) {
      setRenderLimit((prev) => Math.max(prev, activeList.length));
    }
  }, [pageReady, activeList.length, viewMode]);

  useLayoutEffect(() => {
    if (!pageReady || loading) return;
    const y = pendingScrollYRef.current;
    if (y <= 0) return;
    if (activeList.length > 0 && renderLimit < activeList.length) return;

    restoreHomeScroll(y);
    pendingScrollYRef.current = 0;
  }, [
    pageReady,
    loading,
    renderLimit,
    activeList.length,
    viewMode,
    typeFilter,
    query,
  ]);

  useEffect(() => {
    const el = renderSentinelRef.current;
    if (!el || !canExpandRender || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setRenderLimit((prev) =>
          Math.min(prev + HOME_PAGE_SIZE, activeList.length)
        );
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeList.length, canExpandRender, loading, renderLimit]);

  useEffect(() => {
    if (!pageReady || loading || !awaitingFilterMatch) return;
    if (loadingMoreRef.current) return;
    if (filterLoadAttemptsRef.current >= MAX_FILTER_LOAD_ATTEMPTS) {
      setFilterSearchExhausted(true);
      return;
    }

    filterLoadAttemptsRef.current += 1;
    void loadMore();
  }, [pageReady, loading, awaitingFilterMatch, loadMore]);

  useEffect(() => {
    filterLoadAttemptsRef.current = 0;
    setFilterSearchExhausted(false);
  }, [typeFilter, query, viewMode]);

  const resultCount = useMemo(() => {
    if (viewMode === "phoneCase" && query.trim()) return activeList.length;
    if ((viewMode === "outfit" || viewMode === "item") && (typeFilter || query.trim())) {
      return activeList.length;
    }
    const serverTotal = total;
    return serverTotal > 0 ? serverTotal : activeList.length;
  }, [activeList.length, query, total, typeFilter, viewMode]);

  const emptyMessageKey =
    isFiltering &&
    activeList.length === 0 &&
    getModeRawCount(viewMode, { outfits, items, nailArts, phoneCases }) > 0
      ? "home.noFilterMatches"
      : viewMode === "outfit"
      ? "home.noOutfits"
      : viewMode === "item"
        ? "home.noItems"
        : viewMode === "nailArt"
          ? "home.noNailArts"
          : "home.noPhoneCases";

  const showGridSkeleton =
    loading || awaitingFilterMatch;

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

      {showGridSkeleton ? (
        <HomeGridSkeleton />
      ) : activeList.length === 0 ? (
        <>
          <div className="rounded-xl bg-empty p-8 text-center sm:p-12">
            <p className="text-sm text-muted">{t(emptyMessageKey)}</p>
          </div>
          {hasMore && (
            <div ref={sentinelRef} className="h-px" aria-hidden />
          )}
        </>
      ) : (
        <>
          {viewMode === "nailArt" ? (
            <NailArtMasonry>
              {visibleNailArts.map((nailArt, index) => (
                <NailArtCard
                  key={nailArt.id}
                  id={nailArt.id}
                  image={nailArt.image}
                  priority={isGridLcpCandidate(index)}
                />
              ))}
            </NailArtMasonry>
          ) : (
            <div className={gridClass}>
              {viewMode === "outfit"
                ? visibleOutfits.map((outfit, index) => (
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
                  ? visibleItems.map((item, index) => (
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
                  : visiblePhoneCases.map((phoneCase, index) => (
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
                    ))}
            </div>
          )}
          {canExpandRender && (
            <div
              ref={renderSentinelRef}
              className="h-px"
              aria-hidden
            />
          )}
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
