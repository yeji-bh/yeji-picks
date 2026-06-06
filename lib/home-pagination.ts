export const HOME_LOADED_KEY = "yeji-outfits-home-loaded";
export const HOME_PAGE_SIZE = 8;

export function getSavedLoadedCount(): number {
  if (typeof window === "undefined") return HOME_PAGE_SIZE;
  try {
    const raw = localStorage.getItem(HOME_LOADED_KEY);
    const n = raw ? parseInt(raw, 10) : HOME_PAGE_SIZE;
    return Number.isFinite(n) && n >= HOME_PAGE_SIZE ? n : HOME_PAGE_SIZE;
  } catch {
    return HOME_PAGE_SIZE;
  }
}

export function setSavedLoadedCount(count: number): void {
  localStorage.setItem(HOME_LOADED_KEY, String(Math.max(count, HOME_PAGE_SIZE)));
}
