export const HOME_SCROLL_KEY = "yeji-outfits-home-scroll";

export function saveHomeScroll(y: number): void {
  sessionStorage.setItem(HOME_SCROLL_KEY, String(Math.max(0, Math.round(y))));
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
