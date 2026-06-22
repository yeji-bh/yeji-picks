"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function OutfitDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error("[outfit detail]", error);
  }, [error]);

  return (
    <div className="py-16 text-center">
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-foreground">
        {t("detailError.title")}
      </h1>
      <p className="mt-2 text-sm text-muted">{t("detailError.outfitDesc")}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="cursor-pointer rounded-lg border border-border bg-white px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:bg-card dark:text-foreground-secondary dark:hover:bg-subtle"
        >
          {t("detailError.retry")}
        </button>
        <Link
          href="/"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-primary dark:text-primary-fg"
        >
          {t("detailError.backHome")}
        </Link>
      </div>
    </div>
  );
}
