"use client";

import { useTranslation } from "react-i18next";
import { ITEM_TYPE_GROUPS, type ItemType, type ItemTypeGroup } from "@/lib/types";

export default function ItemTypeSelect({
  value,
  onChange,
  className = "mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-neutral-400",
}: {
  value: ItemType;
  onChange: (value: ItemType) => void;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ItemType)}
      className={className}
    >
      {(Object.keys(ITEM_TYPE_GROUPS) as ItemTypeGroup[]).map((group) => (
        <optgroup key={group} label={t(`itemTypeGroups.${group}`)}>
          {ITEM_TYPE_GROUPS[group].map((type) => (
            <option key={type} value={type}>
              {t(`itemTypes.${type}`)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
