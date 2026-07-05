export type HomeViewMode =
  | "outfit"
  | "item"
  | "nailArt"
  | "phoneCase"
  | "perfume"
  | "lovedItem"
  | "cosmetic";

const STORAGE_KEY = "home-view-mode";
const VALID_MODES = new Set<HomeViewMode>([
  "outfit",
  "item",
  "nailArt",
  "phoneCase",
  "perfume",
  "lovedItem",
  "cosmetic",
]);

export function getSavedViewMode(): HomeViewMode {
  if (typeof window === "undefined") return "outfit";
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw && VALID_MODES.has(raw as HomeViewMode)
    ? (raw as HomeViewMode)
    : "outfit";
}

export function setSavedViewMode(mode: HomeViewMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, mode);
}

export function isGalleryViewMode(mode: HomeViewMode): boolean {
  return (
    mode === "nailArt" ||
    mode === "phoneCase" ||
    mode === "perfume" ||
    mode === "lovedItem" ||
    mode === "cosmetic"
  );
}
