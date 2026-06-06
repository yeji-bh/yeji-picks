"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthProvider";
import {
  getFavoriteItemIds,
  getFavoriteOutfitIds,
  toggleFavoriteItem,
  toggleFavoriteOutfit,
} from "@/lib/favorites";

type FavoritesContextValue = {
  ready: boolean;
  isOutfitFavorite: (id: string) => boolean;
  isItemFavorite: (id: string) => boolean;
  toggleOutfit: (id: string) => Promise<boolean>;
  toggleItem: (id: string) => Promise<boolean>;
};

const FavoritesContext = createContext<FavoritesContextValue>({
  ready: false,
  isOutfitFavorite: () => false,
  isItemFavorite: () => false,
  toggleOutfit: async () => false,
  toggleItem: async () => false,
});

export function useFavorites() {
  return useContext(FavoritesContext);
}

export default function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [outfitIds, setOutfitIds] = useState<Set<string>>(new Set());
  const [itemIds, setItemIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function loadRemote() {
      if (!user) return;
      try {
        const res = await fetch("/api/favorites");
        if (!cancelled && res.ok) {
          const data = await res.json();
          setOutfitIds(new Set(data.outfitIds ?? []));
          setItemIds(new Set(data.itemIds ?? []));
        }
      } catch {
        if (!cancelled) {
          setOutfitIds(new Set());
          setItemIds(new Set());
        }
      }
      if (!cancelled) setReady(true);
    }

    if (!user) {
      setOutfitIds(new Set(getFavoriteOutfitIds()));
      setItemIds(new Set(getFavoriteItemIds()));
      setReady(true);
      return () => {
        cancelled = true;
      };
    }

    setReady(false);

    const run = () => {
      void loadRemote();
    };

    if (typeof requestIdleCallback === "function") {
      idleId = requestIdleCallback(run, { timeout: 2500 });
    } else {
      timeoutId = setTimeout(run, 150);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof cancelIdleCallback === "function") {
        cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user?.id]);

  const toggleOutfit = useCallback(
    async (id: string) => {
      if (user) {
        const active = outfitIds.has(id);
        const res = await fetch(
          active
            ? `/api/favorites?type=outfit&targetId=${id}`
            : "/api/favorites",
          active
            ? { method: "DELETE" }
            : {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "outfit", targetId: id }),
              }
        );
        if (!res.ok) return active;
        setOutfitIds((prev) => {
          const next = new Set(prev);
          if (active) next.delete(id);
          else next.add(id);
          return next;
        });
        return !active;
      }
      const next = toggleFavoriteOutfit(id);
      setOutfitIds(new Set(getFavoriteOutfitIds()));
      return next;
    },
    [user, outfitIds]
  );

  const toggleItem = useCallback(
    async (id: string) => {
      if (user) {
        const active = itemIds.has(id);
        const res = await fetch(
          active
            ? `/api/favorites?type=item&targetId=${id}`
            : "/api/favorites",
          active
            ? { method: "DELETE" }
            : {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "item", targetId: id }),
              }
        );
        if (!res.ok) return active;
        setItemIds((prev) => {
          const next = new Set(prev);
          if (active) next.delete(id);
          else next.add(id);
          return next;
        });
        return !active;
      }
      const next = toggleFavoriteItem(id);
      setItemIds(new Set(getFavoriteItemIds()));
      return next;
    },
    [user, itemIds]
  );

  const value = useMemo(
    () => ({
      ready,
      isOutfitFavorite: (id: string) => outfitIds.has(id),
      isItemFavorite: (id: string) => itemIds.has(id),
      toggleOutfit,
      toggleItem,
    }),
    [ready, outfitIds, itemIds, toggleOutfit, toggleItem]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
