"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ItemCard from "./ItemCard";
import {
  FILTER_TYPES,
  getFilterGroup,
  matchesTypeFilter,
  normalizeItemType,
  type ItemTypeGroup,
} from "@/lib/types";

type BrandItem = {
  id: string;
  type: string;
  brand: string | null;
  productName: string | null;
  image: string | null;
  useCount: number;
};

function FilterTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative shrink-0 cursor-pointer whitespace-nowrap px-1 text-[15px] font-medium transition-colors ${
        active ? "font-semibold text-neutral-900" : "text-neutral-500 hover:text-neutral-700"
      }`}
    >
      {label}
    </button>
  );
}

const filterScrollClass =
  "flex flex-nowrap gap-5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export default function BrandDetailContent({
  brand,
  items,
}: {
  brand: string;
  items: BrandItem[];
}) {
  const { t } = useTranslation();
  const [typeFilter, setTypeFilter] = useState("");

  const availableGroups = useMemo(() => {
    const groups = new Set<ItemTypeGroup>();
    for (const item of items) {
      const group = getFilterGroup(normalizeItemType(item.type));
      if (group) groups.add(group);
    }
    return FILTER_TYPES.filter((group) => groups.has(group));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!typeFilter) return items;
    return items.filter((item) => matchesTypeFilter(item.type, typeFilter));
  }, [items, typeFilter]);

  const displayCount = typeFilter ? filteredItems.length : items.length;

  return (
    <div className="min-w-0">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          {brand}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {t("home.itemResultCount", { count: displayCount })}
        </p>
      </header>

      {availableGroups.length > 0 && (
        <div className="mt-5 border-b border-border pb-3">
          <div className={filterScrollClass}>
            <FilterTab
              active={!typeFilter}
              label={t("home.filterAll")}
              onClick={() => setTypeFilter("")}
            />
            {availableGroups.map((group) => (
              <FilterTab
                key={group}
                active={typeFilter === group}
                label={t(`itemTypeGroups.${group}`)}
                onClick={() => setTypeFilter(group)}
              />
            ))}
          </div>
        </div>
      )}

      <section className="mt-6">
        {filteredItems.length === 0 ? (
          <p className="text-sm text-muted">{t("brand.noItems")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                id={item.id}
                image={item.image}
                type={item.type}
                brand={item.brand}
                productName={item.productName}
                useCount={item.useCount}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
