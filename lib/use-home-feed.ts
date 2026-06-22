"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeViewMode } from "@/lib/home-view-mode";
import type { HomeSort } from "@/lib/home-sort";
import { HOME_PAGE_SIZE } from "@/lib/home-pagination";

export type FeedPage<T> = {
  items: T[];
  total: number;
  hasMore: boolean;
};

type FeedSnapshot = {
  items: unknown[];
  total: number;
  hasMore: boolean;
};

const RESPONSE_KEYS: Record<
  HomeViewMode,
  "outfits" | "items" | "nailArts" | "phoneCases" | "perfumes"
> = {
  outfit: "outfits",
  item: "items",
  nailArt: "nailArts",
  phoneCase: "phoneCases",
  perfume: "perfumes",
};

const API_PATHS: Record<HomeViewMode, string> = {
  outfit: "/api/outfits/list",
  item: "/api/items/list",
  nailArt: "/api/nail-arts/list",
  phoneCase: "/api/phone-cases/list",
  perfume: "/api/perfumes/list",
};

export function buildHomeFeedKey(
  mode: HomeViewMode,
  sort: HomeSort,
  typeFilter: string,
  query: string,
  locale: string
): string {
  return [mode, sort, typeFilter, query.trim(), locale].join("\0");
}

function buildFeedUrl(
  mode: HomeViewMode,
  offset: number,
  sort: HomeSort,
  typeFilter: string,
  query: string,
  locale: string
): string {
  const params = new URLSearchParams({
    limit: String(HOME_PAGE_SIZE),
    offset: String(offset),
    sort,
    withTotal: offset === 0 ? "1" : "0",
  });

  if (mode === "outfit" || mode === "item") {
    params.set("locale", locale);
    if (typeFilter) params.set("typeFilter", typeFilter);
  }

  const q = query.trim();
  if (q) params.set("q", q);

  return `${API_PATHS[mode]}?${params.toString()}`;
}

function dedupeById<T extends { id: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

type UseHomeFeedOptions<T extends { id: string }> = {
  mode: HomeViewMode;
  sort: HomeSort;
  typeFilter: string;
  query: string;
  locale: string;
  seed?: FeedPage<T> | null;
  seedKey?: string | null;
  prefsReady?: boolean;
};

const feedCache = new Map<string, FeedSnapshot>();

export function useHomeFeed<T extends { id: string }>({
  mode,
  sort,
  typeFilter,
  query,
  locale,
  seed,
  seedKey,
  prefsReady = true,
}: UseHomeFeedOptions<T>) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const feedKey = buildHomeFeedKey(
    mode,
    sort,
    typeFilter,
    debouncedQuery,
    locale
  );

  const cacheRef = useRef(feedCache);
  const fetchGenerationRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const itemsRef = useRef<T[]>([]);
  const totalRef = useRef(total);
  itemsRef.current = items;
  totalRef.current = total;

  const writeCache = useCallback(
    (nextItems: T[], nextTotal: number, nextHasMore: boolean) => {
      cacheRef.current.set(feedKey, {
        items: nextItems,
        total: nextTotal,
        hasMore: nextHasMore,
      });
    },
    [feedKey]
  );

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      const generation = ++fetchGenerationRef.current;
      const res = await fetch(
        buildFeedUrl(
          mode,
          offset,
          sort,
          typeFilter,
          debouncedQuery,
          locale
        ),
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("feed fetch failed");

      const data = (await res.json()) as Record<string, unknown>;
      if (generation !== fetchGenerationRef.current) return null;

      const key = RESPONSE_KEYS[mode];
      const pageItems = dedupeById((data[key] as T[]) ?? []);
      const pageTotal = Number(data.total ?? 0);
      const pageHasMore = Boolean(data.hasMore);

      if (append) {
        setItems((prev) => {
          const next = dedupeById([...prev, ...pageItems]);
          writeCache(next, totalRef.current, pageHasMore);
          return next;
        });
        setHasMore(pageHasMore);
      } else {
        setItems(pageItems);
        setTotal(pageTotal);
        setHasMore(pageHasMore);
        writeCache(pageItems, pageTotal, pageHasMore);
      }
      return { items: pageItems, total: pageTotal, hasMore: pageHasMore };
    },
    [mode, sort, typeFilter, debouncedQuery, locale, writeCache]
  );

  useEffect(() => {
    if (!prefsReady) return;

    const cached = cacheRef.current.get(feedKey);
    if (cached) {
      setItems(dedupeById(cached.items as T[]));
      setTotal(cached.total);
      setHasMore(cached.hasMore);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (seed && seedKey === feedKey) {
      const seededItems = dedupeById(seed.items);
      setItems(seededItems);
      setTotal(seed.total);
      setHasMore(seed.hasMore);
      writeCache(seededItems, seed.total, seed.hasMore);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    setLoading(true);
    setLoadingMore(false);

    void fetchPage(0, false)
      .catch(() => {
        setItems([]);
        setTotal(0);
        setHasMore(false);
      })
      .finally(() => setLoading(false));
  }, [feedKey, fetchPage, seed, seedKey, writeCache, prefsReady]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      await fetchPage(itemsRef.current.length, true);
    } catch {
      /* ignore */
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore]);

  return {
    items,
    total,
    hasMore,
    loading,
    loadingMore,
    loadMore,
    feedKey,
    debouncedQuery,
  };
}
