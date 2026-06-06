export type HomeViewMode = "outfit" | "item";

const STORAGE_KEY = "home-view-mode";

export function getSavedViewMode(): HomeViewMode {
  if (typeof window === "undefined") return "outfit";
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === "item" ? "item" : "outfit";
}

export function setSavedViewMode(mode: HomeViewMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, mode);
}
