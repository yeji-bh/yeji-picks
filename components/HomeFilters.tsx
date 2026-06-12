"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FILTER_TYPES,
  getFilterGroup,
  ITEM_TYPE_GROUPS,
  type ItemType,
  type ItemTypeGroup,
} from "@/lib/types";
import type { HomeViewMode } from "@/lib/home-view-mode";
import { OUTFIT_SORT_OPTIONS, type OutfitSort } from "@/lib/outfit-sort";
import ViewModeTabs from "./ViewModeTabs";

type HomeFiltersProps = {
  viewMode: HomeViewMode;
  typeFilter: string;
  query: string;
  sort: OutfitSort;
  resultCount: number;
  onViewModeChange: (mode: HomeViewMode) => void;
  onTypeChange: (type: string) => void;
  onQueryChange: (query: string) => void;
  onSortChange: (sort: OutfitSort) => void;
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
      className={`relative shrink-0 cursor-pointer whitespace-nowrap text-1rem font-medium transition-colors ${
        active ? "font-semibold text-accent" : "text-inactive hover:text-foreground-secondary"
      }`}
    >
      {label}
    </button>
  );
}

const searchClass =
  "box-border min-h-11 w-full min-w-0 rounded-sm border border-border bg-input py-3 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-inactive focus:border-neutral-400";

const sortClass =
  "filter-select box-border h-9 min-w-[11rem] cursor-pointer rounded-sm border border-border bg-input px-2 pr-7 text-sm text-foreground-secondary outline-none focus:border-neutral-400";

const filterScrollClass =
  "flex flex-nowrap gap-7 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

function groupForSub(sub: ItemType): ItemTypeGroup {
  for (const group of FILTER_TYPES) {
    if ((ITEM_TYPE_GROUPS[group] as readonly string[]).includes(sub)) {
      return group;
    }
  }
  const idx = sub.indexOf("_");
  return (idx === -1 ? sub : sub.slice(0, idx)) as ItemTypeGroup;
}

export default function HomeFilters({
  viewMode,
  typeFilter,
  query,
  sort,
  resultCount,
  onViewModeChange,
  onTypeChange,
  onQueryChange,
  onSortChange,
}: HomeFiltersProps) {
  const { t } = useTranslation();
  const [expandedGroup, setExpandedGroup] = useState<ItemTypeGroup | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const activeGroup = getFilterGroup(typeFilter);
  const visibleGroup = expandedGroup ?? activeGroup;
  const subTypes = visibleGroup ? ITEM_TYPE_GROUPS[visibleGroup] : null;
  const showSyntheticSubTab = subTypes != null && subTypes.length <= 1;

  function handleMainClick(group: ItemTypeGroup) {
    if (typeFilter === group) {
      onTypeChange("");
      setExpandedGroup(null);
      return;
    }
    onTypeChange(group);
    setExpandedGroup(group);
  }

  function handleGroupAllClick(group: ItemTypeGroup) {
    onTypeChange(group);
    setExpandedGroup(group);
  }

  function isSyntheticSubActive(group: ItemTypeGroup): boolean {
    if (typeFilter === group) return true;
    const subs = ITEM_TYPE_GROUPS[group];
    return subs.length === 1 && typeFilter === subs[0];
  }

  function handleSubClick(sub: ItemType) {
    const group = groupForSub(sub);
    if (typeFilter === sub) {
      onTypeChange(group);
      setExpandedGroup(group);
      return;
    }
    onTypeChange(sub);
    setExpandedGroup(group);
  }

  function clearFilter() {
    onTypeChange("");
    setExpandedGroup(null);
  }

  function isMainActive(group: ItemTypeGroup): boolean {
    return typeFilter === group || activeGroup === group;
  }

  return (
    <div className="mb-5 space-y-3">
      <ViewModeTabs viewMode={viewMode} onViewModeChange={onViewModeChange} />

      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t("home.searchPlaceholder")}
          className={searchClass}
        />
      </div>

      <div>
        {filtersOpen && (
          <div className="pt-2">
            <div className={filterScrollClass}>
              <FilterTab
                active={!typeFilter}
                label={t("home.filterAll")}
                onClick={clearFilter}
              />
              {FILTER_TYPES.map((group) => (
                <FilterTab
                  key={group}
                  active={isMainActive(group)}
                  label={t(`itemTypeGroups.${group}`)}
                  onClick={() => handleMainClick(group)}
                />
              ))}
            </div>

            {visibleGroup && subTypes && (
              <div className="mt-3">
                <div className={filterScrollClass}>
                  {showSyntheticSubTab ? (
                    <FilterTab
                      key={`${visibleGroup}-all`}
                      active={isSyntheticSubActive(visibleGroup)}
                      label={t("home.filterGroupAll", {
                        group: t(`itemTypeGroups.${visibleGroup}`),
                      })}
                      onClick={() => handleGroupAllClick(visibleGroup)}
                    />
                  ) : (
                    subTypes.map((sub) => (
                      <FilterTab
                        key={sub}
                        active={typeFilter === sub}
                        label={t(`itemTypes.${sub as ItemType}`)}
                        onClick={() => handleSubClick(sub)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="shrink-0 text-sm text-neutral-600">
          {viewMode === "outfit"
            ? t("home.outfitResultCount", { count: resultCount })
            : t("home.itemResultCount", { count: resultCount })}
        </p>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as OutfitSort)}
          className={sortClass}
          aria-label={t("home.sortLabel")}
        >
          {OUTFIT_SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`home.sort.${option}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
