"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider";
import FavoriteButton from "./FavoriteButton";
import OutfitReport from "./OutfitReport";

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
    <header className="border-b border-border pb-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Link
          href="/"
          className="cursor-pointer text-xs text-muted hover:text-neutral-900 sm:text-sm"
        >
          ← {t("outfit.backHome")}
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          {isAdmin && (
            <Link
              href={`/outfit/${outfitId}/edit`}
              className="cursor-pointer rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 sm:text-sm"
            >
              {t("mySubmissions.edit")}
            </Link>
          )}
          <FavoriteButton
            type="outfit"
            targetId={outfitId}
            variant="inline"
            size="lg"
            className="bg-neutral-50"
          />
        </div>
      </div>
      <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h1 className="w-full min-w-0 text-base font-semibold tracking-tight text-neutral-900 sm:flex-1 sm:text-lg lg:text-xl">
          {displayTitle}
        </h1>
        <div className="shrink-0 sm:ml-auto">
          <OutfitReport outfitId={outfitId} outfitTitle={outfitTitle} />
        </div>
      </div>
    </header>
  );
}
