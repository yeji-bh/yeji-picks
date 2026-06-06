"use client";

import { useTranslation } from "react-i18next";
import { normalizeItemType } from "@/lib/types";

export default function ReportTarget({
  kind,
  outfitTitle,
  itemType,
  itemBrand,
  itemProductName,
}: {
  kind: "outfit" | "item";
  outfitTitle: string;
  itemType?: string;
  itemBrand?: string | null;
  itemProductName?: string | null;
}) {
  const { t } = useTranslation();
  const displayTitle =
    outfitTitle === "outfit" ? t("outfit.unnamed") : outfitTitle;

  return (
    <div className="rounded-lg border border-border bg-neutral-50 px-3 py-2 text-sm">
      {kind === "outfit" ? (
        <p className="font-medium text-neutral-900">{displayTitle}</p>
      ) : (
        <>
          <p className="font-medium text-neutral-900">{displayTitle}</p>
          <p className="mt-1 text-xs text-neutral-600">
            {itemType && t(`itemTypes.${normalizeItemType(itemType)}`)}
            {itemBrand && (
              <>
                {itemType && " · "}
                {itemBrand}
              </>
            )}
            {itemProductName && (
              <>
                {(itemType || itemBrand) && " · "}
                {itemProductName}
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}
