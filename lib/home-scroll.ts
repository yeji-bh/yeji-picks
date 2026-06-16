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

/** Max scroll position for the current document height. */
export function getMaxScrollY(): number {
  if (typeof window === "undefined") return 0;
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

/** Scroll to `targetY`, or to top if content is not tall enough yet. */
export function restoreHomeScroll(targetY: number): boolean {
  if (typeof window === "undefined" || targetY <= 0) return true;

  const maxY = getMaxScrollY();
  if (maxY < targetY - 16) {
    window.scrollTo(0, 0);
    clearHomeScroll();
    return false;
  }

  window.scrollTo(0, targetY);
  clearHomeScroll();
  return true;
}
