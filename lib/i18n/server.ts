import type { NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  I18N_NAMESPACE,
  LOCALE_COOKIE,
  isLocale,
  type Locale,
} from "@/lib/i18n/settings";
import {
  localeFromAcceptLanguage,
  parseApiLocale,
} from "@/lib/i18n/resolve-locale";

import zhCN from "@/locales/zh-CN/api.json";
import zhTW from "@/locales/zh-TW/api.json";
import en from "@/locales/en/api.json";
import ko from "@/locales/ko/api.json";
import ja from "@/locales/ja/api.json";

type Dict = Record<string, unknown>;

const RESOURCES: Record<Locale, Dict> = {
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  en,
  ko,
  ja,
};

function lookup(dict: Dict, key: string): string | undefined {
  const value = key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Dict)[part];
    }
    return undefined;
  }, dict);
  return typeof value === "string" ? value : undefined;
}

export function resolveApiLocale(request: NextRequest): Locale {
  const fromQuery = parseApiLocale(request.nextUrl.searchParams.get("locale"));
  if (fromQuery) return fromQuery;
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;
  return localeFromAcceptLanguage(request.headers.get("accept-language"));
}

export function apiT(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = RESOURCES[locale] ?? RESOURCES[DEFAULT_LOCALE];
  let text =
    lookup(dict, key) ??
    lookup(RESOURCES[DEFAULT_LOCALE], key) ??
    key;

  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{{${name}}}`, String(value));
    }
  }
  return text;
}

/** @deprecated Only used to access namespace constant */
export { I18N_NAMESPACE };
