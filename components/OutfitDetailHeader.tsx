"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider";
import FavoriteButton from "./FavoriteButton";
import OutfitReport from "./OutfitReport";
import { outfitHref } from "@/lib/entity-href";

export default function OutfitDetailHeader({
  outfitId,
  outfitTitle,
}: {
  outfitId: string;
  outfitTitle: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const displayTitle =
    outfitTitle === "outfit" ? t("outfit.unnamed") : outfitTitle;

  return (
    <header>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h1 className="min-w-0 flex-1 break-words text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl lg:text-[28px]">
          {displayTitle}
        </h1>
        <div className="flex shrink-0 items-center gap-1">
          {isAdmin && (
            <Link
              href={`${outfitHref({ id: outfitId, eventName: outfitTitle })}/edit`}
              className="cursor-pointer rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 sm:text-sm"
            >
              {t("mySubmissions.edit")}
            </Link>
          )}
          <FavoriteButton type="outfit" targetId={outfitId} variant="plain" />
          <OutfitReport outfitId={outfitId} outfitTitle={outfitTitle} />
        </div>
      </div>
    </header>
  );
}
