export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "yeji-theme";

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  return raw === "dark" || raw === "light" ? raw : null;
}

export function getPreferredTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function setStoredTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

/** Inline script — run before paint to avoid flash. */
export const THEME_INIT_SCRIPT = `(function(){try{var k="yeji-theme",s=localStorage.getItem(k),d=s==="dark"||(!s&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;
