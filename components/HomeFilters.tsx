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

type HomeFiltersProps = {
  viewMode: HomeViewMode;
  typeFilter: string;
  query: string;
  sort: OutfitSort;
  onViewModeChange: (mode: HomeViewMode) => void;
  onTypeChange: (type: string) => void;
  onQueryChange: (query: string) => void;
  onSortChange: (sort: OutfitSort) => void;
};

function modeBtnClass(active: boolean): string {
  return `cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? "bg-white text-neutral-900 shadow-sm"
      : "text-muted hover:text-neutral-900"
  }`;
}

const searchClass =
  "box-border h-11 w-full min-w-0 rounded-lg border border-border bg-white px-3 text-base leading-none text-neutral-900 outline-none focus:border-neutral-400 sm:h-10 sm:max-w-md sm:text-sm lg:max-w-lg";

const sortClass =
  "filter-select box-border h-11 w-full cursor-pointer rounded-lg border border-border bg-white px-2 pr-7 text-xs text-muted outline-none focus:border-neutral-400 sm:h-10 sm:w-auto sm:min-w-[8.5rem]";

function pillClass(active: boolean): string {
  return `shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? "bg-neutral-900 text-white"
      : "border border-border bg-white text-neutral-600 hover:border-neutral-300"
  }`;
}

function groupForSub(sub: ItemType): ItemTypeGroup {
  const idx = sub.indexOf("_");
  return (idx === -1 ? sub : sub.slice(0, idx)) as ItemTypeGroup;
}

export default function HomeFilters({
  viewMode,
  typeFilter,
  query,
  sort,
  onViewModeChange,
  onTypeChange,
  onQueryChange,
  onSortChange,
}: HomeFiltersProps) {
  const { t } = useTranslation();
  const [expandedGroup, setExpandedGroup] = useState<ItemTypeGroup | null>(null);

  const activeGroup = getFilterGroup(typeFilter);
  const visibleGroup = expandedGroup ?? activeGroup;
  const subTypes =
    visibleGroup && ITEM_TYPE_GROUPS[visibleGroup].length > 1
      ? ITEM_TYPE_GROUPS[visibleGroup]
      : null;

  function handleMainClick(group: ItemTypeGroup) {
    if (typeFilter === group) {
      onTypeChange("");
      setExpandedGroup(null);
      return;
    }
    onTypeChange(group);
    setExpandedGroup(
      ITEM_TYPE_GROUPS[group].length > 1 ? group : null
    );
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

  const hasActiveFilter = Boolean(typeFilter);

  return (
    <div className="mb-4 space-y-3 sm:mb-6">
      <div
        className="inline-flex rounded-lg border border-border bg-neutral-50 p-0.5"
        role="tablist"
        aria-label={t("home.viewModeLabel")}
      >
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === "outfit"}
          onClick={() => onViewModeChange("outfit")}
          className={modeBtnClass(viewMode === "outfit")}
        >
          {t("home.modeOutfit")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === "item"}
          onClick={() => onViewModeChange("item")}
          className={modeBtnClass(viewMode === "item")}
        >
          {t("home.modeItem")}
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t("home.searchPlaceholder")}
          className={searchClass}
        />
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
          <span className="hidden whitespace-nowrap sm:inline">
            {t("home.sortLabel")}
          </span>
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
        </label>
      </div>

      <div className="rounded-xl border border-border bg-white p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-neutral-700">
            {t("home.filterLabel")}
          </span>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearFilter}
              className="cursor-pointer text-xs text-muted underline hover:text-neutral-900"
            >
              {t("home.filterClear")}
            </button>
          )}
        </div>

        <div className="-mx-0.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={clearFilter}
            className={pillClass(!typeFilter)}
          >
            {t("home.filterAll")}
          </button>

          {FILTER_TYPES.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => handleMainClick(group)}
              className={pillClass(isMainActive(group))}
            >
              {t(`itemTypeGroups.${group}`)}
            </button>
          ))}
        </div>

        {subTypes && (
          <div className="mt-2.5 flex flex-wrap gap-2 border-t border-border pt-2.5">
            <span className="w-full text-[10px] text-muted">
              {t(`itemTypeGroups.${visibleGroup}`)} · {t("home.filterSub")}
            </span>
            {subTypes.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => handleSubClick(sub)}
                className={pillClass(typeFilter === sub)}
              >
                {t(`itemTypes.${sub as ItemType}`)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
