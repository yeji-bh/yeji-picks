"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/settings";

const clientCache = new Map<string, string>();

function getCacheKey(text: string, locale: string) {
  return `${locale}::${text}`;
}

function needsTranslation(locale: Locale) {
  return locale !== DEFAULT_LOCALE;
}

export default function AutoTranslate({
  text,
  className,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  as?: "span" | "p";
}) {
  const { i18n } = useTranslation();
  const locale = (i18n.language as Locale) || DEFAULT_LOCALE;
  const trimmed = text?.trim() ?? "";

  if (!trimmed) return null;

  if (!needsTranslation(locale)) {
    return <Tag className={className}>{trimmed}</Tag>;
  }

  return (
    <AutoTranslateAsync
      text={trimmed}
      locale={locale}
      className={className}
      Tag={Tag}
    />
  );
}

function AutoTranslateAsync({
  text,
  locale,
  className,
  Tag,
}: {
  text: string;
  locale: Locale;
  className?: string;
  Tag: "span" | "p";
}) {
  const key = getCacheKey(text, locale);
  const [display, setDisplay] = useState(
    () => clientCache.get(key) ?? text
  );

  useEffect(() => {
    const cached = clientCache.get(key);
    if (cached) {
      setDisplay(cached);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: [text], to: locale }),
        });
        const data = await res.json();
        if (cancelled) return;
        const translated = data.translations?.[0] ?? text;
        clientCache.set(key, translated);
        setDisplay(translated);
      } catch {
        if (!cancelled) setDisplay(text);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [text, locale, key]);

  return <Tag className={className}>{display}</Tag>;
}
