"use client";

import { useTranslation } from "react-i18next";

export default function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer id="site-footer" className="mt-auto border-t border-border bg-white">
      <div className="mx-auto max-w-6xl space-y-2 px-4 py-4 text-center text-xs text-muted sm:px-6">
        <p>{t("footer.disclaimer")}</p>
        <p>© {t("siteTitle")}</p>
      </div>
    </footer>
  );
}
