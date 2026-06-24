export const LOCALES = ["zh-CN", "zh-TW", "en", "ko", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "zh-CN";
export const LOCALE_COOKIE = "locale";
export const I18N_NAMESPACE = "common";

export const LOCALE_LABELS: Record<Locale, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
  ko: "한국어",
  ja: "日本語",
};

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

export const LOCALE_TO_TRANSLATE: Record<Locale, string> = {
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  en: "en",
  ko: "ko",
  ja: "ja",
};
