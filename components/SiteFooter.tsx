"use client";

import { useTranslation } from "react-i18next";

export default function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer id="site-footer" className="mt-auto border-t border-border bg-white">
      <div className="mx-auto max-w-7xl space-y-2 px-3 py-4 text-center text-xs text-muted sm:px-5">
        <p>© {t("siteTitle")} 2026</p>
      </div>
    </footer>
  );
}
