export const FAVORITES_KEY = "yeji-outfits-favorites";

export type FavoriteStore = {
  outfits: string[];
  items: string[];
  nailArts: string[];
  phoneCases: string[];
};

function emptyStore(): FavoriteStore {
  return { outfits: [], items: [], nailArts: [], phoneCases: [] };
}

export function getFavoriteStore(): FavoriteStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return {
        outfits: parsed.filter((id) => typeof id === "string"),
        items: [],
        nailArts: [],
        phoneCases: [],
      };
    }
    if (parsed && typeof parsed === "object") {
      return {
        outfits: Array.isArray(parsed.outfits)
          ? parsed.outfits.filter((id: unknown) => typeof id === "string")
          : [],
        items: Array.isArray(parsed.items)
          ? parsed.items.filter((id: unknown) => typeof id === "string")
          : [],
        nailArts: Array.isArray(parsed.nailArts)
          ? parsed.nailArts.filter((id: unknown) => typeof id === "string")
          : [],
        phoneCases: Array.isArray(parsed.phoneCases)
          ? parsed.phoneCases.filter((id: unknown) => typeof id === "string")
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

export function getFavoriteNailArtIds(): string[] {
  return getFavoriteStore().nailArts;
}

export function getFavoritePhoneCaseIds(): string[] {
  return getFavoriteStore().phoneCases;
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

export function isFavoriteNailArt(id: string): boolean {
  return getFavoriteNailArtIds().includes(id);
}

export function isFavoritePhoneCase(id: string): boolean {
  return getFavoritePhoneCaseIds().includes(id);
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

export function toggleFavoriteNailArt(id: string): boolean {
  const store = getFavoriteStore();
  const exists = store.nailArts.includes(id);
  store.nailArts = exists
    ? store.nailArts.filter((x) => x !== id)
    : [...store.nailArts, id];
  setFavoriteStore(store);
  return !exists;
}

export function toggleFavoritePhoneCase(id: string): boolean {
  const store = getFavoriteStore();
  const exists = store.phoneCases.includes(id);
  store.phoneCases = exists
    ? store.phoneCases.filter((x) => x !== id)
    : [...store.phoneCases, id];
  setFavoriteStore(store);
  return !exists;
}

export function clearFavoriteIds(): void {
  localStorage.removeItem(FAVORITES_KEY);
}
