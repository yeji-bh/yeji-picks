"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { outfitHref } from "@/lib/entity-href";

export default function OutfitEditPageHeader({ outfitId }: { outfitId: string }) {
  const { t } = useTranslation();

  return (
    <div className="mb-4 border-b border-border pb-3 sm:mb-6">
      <Link
        href={outfitHref({ id: outfitId })}
        className="cursor-pointer text-xs text-muted hover:text-neutral-900 sm:text-sm"
      >
        ← {t("outfit.backDetail")}
      </Link>
      <h1 className="mt-1.5 text-base font-semibold text-neutral-900 sm:text-lg">
        {t("mySubmissions.editOutfit")}
      </h1>
    </div>
  );
}
