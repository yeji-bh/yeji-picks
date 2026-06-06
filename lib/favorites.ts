export const FAVORITES_KEY = "yeji-outfits-favorites";

export type FavoriteStore = {
  outfits: string[];
  items: string[];
};

function emptyStore(): FavoriteStore {
  return { outfits: [], items: [] };
}

export function getFavoriteStore(): FavoriteStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { outfits: parsed.filter((id) => typeof id === "string"), items: [] };
    }
    if (parsed && typeof parsed === "object") {
      return {
        outfits: Array.isArray(parsed.outfits)
          ? parsed.outfits.filter((id: unknown) => typeof id === "string")
          : [],
        items: Array.isArray(parsed.items)
          ? parsed.items.filter((id: unknown) => typeof id === "string")
          : [],
      };
    }
    return emptyStore();
  } catch {
    return emptyStore();
  }
}

export function setFavoriteStore(store: FavoriteStore): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(store));
}

export function getFavoriteOutfitIds(): string[] {
  return getFavoriteStore().outfits;
}

export function getFavoriteItemIds(): string[] {
  return getFavoriteStore().items;
}

/** @deprecated use getFavoriteStore */
export function getFavoriteIds(): FavoriteStore {
  return getFavoriteStore();
}

export function isFavoriteOutfit(id: string): boolean {
  return getFavoriteOutfitIds().includes(id);
}

export function isFavoriteItem(id: string): boolean {
  return getFavoriteItemIds().includes(id);
}

export function toggleFavoriteOutfit(id: string): boolean {
  const store = getFavoriteStore();
  const exists = store.outfits.includes(id);
  store.outfits = exists
    ? store.outfits.filter((x) => x !== id)
    : [...store.outfits, id];
  setFavoriteStore(store);
  return !exists;
}

export function toggleFavoriteItem(id: string): boolean {
  const store = getFavoriteStore();
  const exists = store.items.includes(id);
  store.items = exists
    ? store.items.filter((x) => x !== id)
    : [...store.items, id];
  setFavoriteStore(store);
  return !exists;
}

export function clearFavoriteIds(): void {
  localStorage.removeItem(FAVORITES_KEY);
}
