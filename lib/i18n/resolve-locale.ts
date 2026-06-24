import {
  isLocale,
  type Locale,
} from "@/lib/i18n/settings";

export const LOCALE_MANUAL_COOKIE = "locale_manual";

export function parseApiLocale(value: string | null | undefined) {
  const normalized = value ?? undefined;
  return isLocale(normalized) ? normalized : null;
}

function isTraditionalChinese(tag: string): boolean {
  const lang = tag.toLowerCase();
  if (lang.startsWith("zh-hant")) return true;
  return (
    lang.startsWith("zh-tw") ||
    lang.startsWith("zh-hk") ||
    lang.startsWith("zh-mo")
  );
}

function isSimplifiedChinese(tag: string): boolean {
  const lang = tag.toLowerCase();
  if (lang.startsWith("zh-hans")) return true;
  return lang.startsWith("zh-cn") || lang.startsWith("zh-sg");
}

/** Map Accept-Language to site locale; unmatched languages fall back to English. */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return "en";

  const languages = header
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .filter(Boolean);

  for (const lang of languages) {
    if (isTraditionalChinese(lang)) return "zh-TW";
    if (isSimplifiedChinese(lang)) return "zh-CN";
    if (lang === "zh") continue;
    if (lang.startsWith("ja")) return "ja";
    if (lang.startsWith("ko")) return "ko";
    if (lang.startsWith("en")) return "en";
  }

  return "en";
}

export function resolveInitialLocale(
  localeCookie: string | undefined,
  _localeManual: string | undefined,
  acceptLanguage: string | null
): Locale {
  if (isLocale(localeCookie)) {
    return localeCookie;
  }
  return localeFromAcceptLanguage(acceptLanguage);
}
