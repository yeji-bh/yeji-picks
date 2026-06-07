export const HOME_SCROLL_KEY = "yeji-outfits-home-scroll";

export function saveHomeScroll(y: number): void {
  sessionStorage.setItem(HOME_SCROLL_KEY, String(Math.max(0, Math.round(y))));
}

/** Only persist scroll when leaving the home page. */
export function saveHomeScrollIfHome(y?: number): void {
  if (typeof window === "undefined" || window.location.pathname !== "/") return;
  saveHomeScroll(y ?? window.scrollY);
}

export function getHomeScroll(): number {
  try {
    const raw = sessionStorage.getItem(HOME_SCROLL_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function clearHomeScroll(): void {
  sessionStorage.removeItem(HOME_SCROLL_KEY);
}
