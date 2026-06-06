"use client";

import { useTranslation } from "react-i18next";
import { ITEM_TYPES, normalizeItemType, type ItemType } from "@/lib/types";

export default function ItemTypeBadges({
  types,
  className = "",
}: {
  types: string[];
  className?: string;
}) {
  const { t } = useTranslation();
  const normalized = [...new Set(types.map(normalizeItemType))];
  const sorted = ITEM_TYPES.filter((type) => normalized.includes(type));

  if (sorted.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {sorted.map((type) => (
        <span
          key={type}
          className="rounded-full border border-border bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-600 sm:text-xs"
        >
          {t(`itemTypes.${type as ItemType}`)}
        </span>
      ))}
    </div>
  );
}
