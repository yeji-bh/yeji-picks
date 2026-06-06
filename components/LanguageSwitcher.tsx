"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/lib/i18n/client";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n/settings";
import { IconGlobe } from "./NavIcons";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const locale = (i18n.language as Locale) || "zh-CN";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-1 whitespace-nowrap text-xs text-muted hover:text-neutral-900 sm:text-sm"
        aria-label={t("nav.language")}
        title={t("nav.language")}
      >
        <IconGlobe />
        <span>{LOCALE_LABELS[locale]}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-30 mt-2 min-w-[8rem] rounded-lg border border-border bg-white py-1 shadow-md">
            {LOCALES.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  changeLanguage(loc);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                  locale === loc
                    ? "font-medium text-neutral-900"
                    : "text-neutral-600"
                }`}
              >
                {LOCALE_LABELS[loc]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
