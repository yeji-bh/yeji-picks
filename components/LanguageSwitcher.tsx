"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/lib/i18n/client";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n/settings";
import { IconGlobe } from "./NavIcons";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const locale = (i18n.language as Locale) || "zh-CN";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex cursor-pointer items-center justify-center rounded-md p-2 text-foreground-secondary transition-colors hover:bg-subtle ${className}`}
        aria-label={t("nav.language")}
        title={t("nav.language")}
      >
        <IconGlobe />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="ui-dropdown absolute right-0 z-30 mt-2 min-w-[8rem] py-1">
            {LOCALES.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  changeLanguage(loc);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-subtle ${
                  locale === loc
                    ? "font-medium text-foreground"
                    : "text-foreground-secondary"
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
