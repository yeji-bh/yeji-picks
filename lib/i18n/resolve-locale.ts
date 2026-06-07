import {
  DEFAULT_LOCALE,
  isLocale,
  type Locale,
} from "@/lib/i18n/settings";

export const LOCALE_MANUAL_COOKIE = "locale_manual";

export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const languages = header
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .filter(Boolean);

  for (const lang of languages) {
    if (lang.startsWith("zh-tw") || lang.startsWith("zh-hk")) return "zh-TW";
    if (lang.startsWith("zh-cn")) return "zh-CN";
    if (lang === "zh") return "zh-CN";
    if (lang.startsWith("ko")) return "ko";
    if (lang.startsWith("en")) return "en";
  }

  return DEFAULT_LOCALE;
}

export function resolveInitialLocale(
  localeCookie: string | undefined,
  localeManual: string | undefined,
  acceptLanguage: string | null
): Locale {
  if (localeManual === "1" && isLocale(localeCookie)) {
    return localeCookie;
  }
  return localeFromAcceptLanguage(acceptLanguage);
}
