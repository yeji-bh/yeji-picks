export const HOME_LOADED_KEY = "yeji-outfits-home-loaded";
export const HOME_PAGE_SIZE = 8;
/** First paint: only this many cards in the DOM before scroll expands. */
export const HOME_INITIAL_RENDER = 8;
/** Cap restored scroll session to avoid loading/rendering hundreds at once. */
export const MAX_HOME_RESTORE = 48;

export function getSavedLoadedCount(): number {
  if (typeof window === "undefined") return HOME_PAGE_SIZE;
  try {
    const raw = localStorage.getItem(HOME_LOADED_KEY);
    const n = raw ? parseInt(raw, 10) : HOME_PAGE_SIZE;
    if (!Number.isFinite(n) || n < HOME_PAGE_SIZE) return HOME_PAGE_SIZE;
    return Math.min(n, MAX_HOME_RESTORE);
  } catch {
    return HOME_PAGE_SIZE;
  }
}

export function setSavedLoadedCount(count: number): void {
  localStorage.setItem(HOME_LOADED_KEY, String(Math.max(count, HOME_PAGE_SIZE)));
}
