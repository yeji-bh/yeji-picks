import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/settings";

import zhCN from "@/locales/zh-CN/common.json";
import zhTW from "@/locales/zh-TW/common.json";
import en from "@/locales/en/common.json";
import ko from "@/locales/ko/common.json";
import ja from "@/locales/ja/common.json";

type SiteMetaStrings = {
  siteMetaTitle: string;
  siteMetaDescription: string;
  siteMetaKeywords: string;
};

const META_BY_LOCALE: Record<Locale, SiteMetaStrings> = {
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  en,
  ko,
  ja,
};

export function buildSiteMetadata(locale: Locale): Metadata {
  const meta = META_BY_LOCALE[locale] ?? META_BY_LOCALE["zh-CN"];
  const keywords = meta.siteMetaKeywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    title: meta.siteMetaTitle,
    description: meta.siteMetaDescription,
    keywords,
    openGraph: {
      title: meta.siteMetaTitle,
      description: meta.siteMetaDescription,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: meta.siteMetaTitle,
      description: meta.siteMetaDescription,
    },
  };
}
