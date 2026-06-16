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
  getFavoriteNailArtIds,
  getFavoriteOutfitIds,
  getFavoritePhoneCaseIds,
  toggleFavoriteItem,
  toggleFavoriteNailArt,
  toggleFavoriteOutfit,
  toggleFavoritePhoneCase,
} from "@/lib/favorites";

type FavoritesContextValue = {
  ready: boolean;
  isOutfitFavorite: (id: string) => boolean;
  isItemFavorite: (id: string) => boolean;
  isNailArtFavorite: (id: string) => boolean;
  isPhoneCaseFavorite: (id: string) => boolean;
  toggleOutfit: (id: string) => Promise<boolean>;
  toggleItem: (id: string) => Promise<boolean>;
  toggleNailArt: (id: string) => Promise<boolean>;
  togglePhoneCase: (id: string) => Promise<boolean>;
};

const FavoritesContext = createContext<FavoritesContextValue>({
  ready: false,
  isOutfitFavorite: () => false,
  isItemFavorite: () => false,
  isNailArtFavorite: () => false,
  isPhoneCaseFavorite: () => false,
  toggleOutfit: async () => false,
  toggleItem: async () => false,
  toggleNailArt: async () => false,
  togglePhoneCase: async () => false,
});

export function useFavorites() {
  return useContext(FavoritesContext);
}

function createToggleHandler(
  type: "outfit" | "item" | "nailArt" | "phoneCase",
  user: { id: string } | null,
  ids: Set<string>,
  setIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  localToggle: (id: string) => boolean,
  localRefresh: () => Set<string>
) {
  return async (id: string) => {
    if (user) {
      const active = ids.has(id);
      const res = await fetch(
        active
          ? `/api/favorites?type=${type}&targetId=${id}`
          : "/api/favorites",
        active
          ? { method: "DELETE" }
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type, targetId: id }),
            }
      );
      if (!res.ok) return active;
      setIds((prev) => {
        const next = new Set(prev);
        if (active) next.delete(id);
        else next.add(id);
        return next;
      });
      return !active;
    }
    const next = localToggle(id);
    setIds(localRefresh());
    return next;
  };
}

export default function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [outfitIds, setOutfitIds] = useState<Set<string>>(new Set());
  const [itemIds, setItemIds] = useState<Set<string>>(new Set());
  const [nailArtIds, setNailArtIds] = useState<Set<string>>(new Set());
  const [phoneCaseIds, setPhoneCaseIds] = useState<Set<string>>(new Set());
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
          setNailArtIds(new Set(data.nailArtIds ?? []));
          setPhoneCaseIds(new Set(data.phoneCaseIds ?? []));
        }
      } catch {
        if (!cancelled) {
          setOutfitIds(new Set());
          setItemIds(new Set());
          setNailArtIds(new Set());
          setPhoneCaseIds(new Set());
        }
      }
      if (!cancelled) setReady(true);
    }

    if (!user) {
      setOutfitIds(new Set(getFavoriteOutfitIds()));
      setItemIds(new Set(getFavoriteItemIds()));
      setNailArtIds(new Set(getFavoriteNailArtIds()));
      setPhoneCaseIds(new Set(getFavoritePhoneCaseIds()));
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
    createToggleHandler(
      "outfit",
      user,
      outfitIds,
      setOutfitIds,
      toggleFavoriteOutfit,
      () => new Set(getFavoriteOutfitIds())
    ),
    [user, outfitIds]
  );

  const toggleItem = useCallback(
    createToggleHandler(
      "item",
      user,
      itemIds,
      setItemIds,
      toggleFavoriteItem,
      () => new Set(getFavoriteItemIds())
    ),
    [user, itemIds]
  );

  const toggleNailArt = useCallback(
    createToggleHandler(
      "nailArt",
      user,
      nailArtIds,
      setNailArtIds,
      toggleFavoriteNailArt,
      () => new Set(getFavoriteNailArtIds())
    ),
    [user, nailArtIds]
  );

  const togglePhoneCase = useCallback(
    createToggleHandler(
      "phoneCase",
      user,
      phoneCaseIds,
      setPhoneCaseIds,
      toggleFavoritePhoneCase,
      () => new Set(getFavoritePhoneCaseIds())
    ),
    [user, phoneCaseIds]
  );

  const value = useMemo(
    () => ({
      ready,
      isOutfitFavorite: (id: string) => outfitIds.has(id),
      isItemFavorite: (id: string) => itemIds.has(id),
      isNailArtFavorite: (id: string) => nailArtIds.has(id),
      isPhoneCaseFavorite: (id: string) => phoneCaseIds.has(id),
      toggleOutfit,
      toggleItem,
      toggleNailArt,
      togglePhoneCase,
    }),
    [
      ready,
      outfitIds,
      itemIds,
      nailArtIds,
      phoneCaseIds,
      toggleOutfit,
      toggleItem,
      toggleNailArt,
      togglePhoneCase,
    ]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
