"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { LOCALE_MANUAL_COOKIE } from "./resolve-locale";
import {
  DEFAULT_LOCALE,
  I18N_NAMESPACE,
  LOCALE_COOKIE,
  LOCALES,
  type Locale,
} from "./settings";

import zhCN from "@/locales/zh-CN/common.json";
import zhTW from "@/locales/zh-TW/common.json";
import en from "@/locales/en/common.json";
import ko from "@/locales/ko/common.json";

const resources = {
  "zh-CN": { [I18N_NAMESPACE]: zhCN },
  "zh-TW": { [I18N_NAMESPACE]: zhTW },
  en: { [I18N_NAMESPACE]: en },
  ko: { [I18N_NAMESPACE]: ko },
};

let initialized = false;

export function initI18n(initialLocale: Locale) {
  if (initialized) return i18n;

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLocale,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: [...LOCALES],
      ns: [I18N_NAMESPACE],
      defaultNS: I18N_NAMESPACE,
      interpolation: { escapeValue: false },
      detection: {
        order: ["cookie"],
        lookupCookie: LOCALE_COOKIE,
        caches: ["cookie"],
        cookieMinutes: 525600,
      },
    });

  initialized = true;
  return i18n;
}

export function changeLanguage(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
  document.cookie = `${LOCALE_MANUAL_COOKIE}=1;path=/;max-age=31536000;SameSite=Lax`;
  document.documentElement.lang = locale;
  return i18n.changeLanguage(locale);
}

export { i18n };
