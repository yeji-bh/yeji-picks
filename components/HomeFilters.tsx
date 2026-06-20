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
import { ITEM_SORT_OPTIONS } from "@/lib/item-sort";
import type { HomeViewMode } from "@/lib/home-view-mode";
import { isGalleryViewMode } from "@/lib/home-view-mode";
import { OUTFIT_SORT_OPTIONS } from "@/lib/outfit-sort";
import { GALLERY_SORT_OPTIONS } from "@/lib/gallery-sort";
import type { HomeSort } from "@/lib/home-sort";
import SelectMenu from "./SelectMenu";
import ViewModeTabs from "./ViewModeTabs";

type HomeFiltersProps = {
  viewMode: HomeViewMode;
  typeFilter: string;
  query: string;
  sort: HomeSort;
  resultCount: number;
  onViewModeChange: (mode: HomeViewMode) => void;
  onTypeChange: (type: string) => void;
  onQueryChange: (query: string) => void;
  onSortChange: (sort: HomeSort) => void;
};

function MainFilterTab({
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
      className={`relative shrink-0 cursor-pointer whitespace-nowrap border-b-2 pb-2.5 text-1rem font-medium transition-colors ${
        active
          ? "border-foreground font-semibold text-foreground"
          : "border-transparent text-inactive hover:text-foreground-secondary"
      }`}
    >
      {label}
    </button>
  );
}

function SubFilterTab({
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
      className={`shrink-0 cursor-pointer whitespace-nowrap text-sm font-medium transition-colors ${
        active
          ? "font-semibold text-foreground"
          : "text-inactive hover:text-foreground-secondary"
      }`}
    >
      {label}
    </button>
  );
}

const searchClass =
  "box-border min-h-11 w-full min-w-0 rounded-sm border border-border bg-input py-3 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-inactive focus:border-neutral-400";

const filterScrollClass =
  "flex flex-nowrap gap-7 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

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
  const [filtersOpen, setFiltersOpen] = useState(true);

  const activeGroup = getFilterGroup(typeFilter);
  const subTypes = activeGroup ? ITEM_TYPE_GROUPS[activeGroup] : null;
  const showSyntheticSubTab = subTypes != null && subTypes.length <= 1;

  function handleMainClick(group: ItemTypeGroup) {
    if (typeFilter === group) {
      onTypeChange("");
      return;
    }
    onTypeChange(group);
  }

  function handleGroupAllClick(group: ItemTypeGroup) {
    onTypeChange(group);
  }

  function isSyntheticSubActive(group: ItemTypeGroup): boolean {
    if (typeFilter === group) return true;
    const subs = ITEM_TYPE_GROUPS[group];
    return subs.length === 1 && typeFilter === subs[0];
  }

  function handleSubClick(sub: ItemType) {
    if (typeFilter === sub) {
      onTypeChange(groupForSub(sub));
      return;
    }
    onTypeChange(sub);
  }

  function isMainActive(group: ItemTypeGroup): boolean {
    return typeFilter === group || activeGroup === group;
  }

  const sortOptions =
    viewMode === "item"
      ? ITEM_SORT_OPTIONS
      : isGalleryViewMode(viewMode)
        ? GALLERY_SORT_OPTIONS
        : OUTFIT_SORT_OPTIONS;

  const showCatalogFilters = viewMode === "outfit" || viewMode === "item";
  const showSearch = viewMode !== "nailArt";

  const resultCountKey =
    viewMode === "outfit"
      ? "home.outfitResultCount"
      : viewMode === "item"
        ? "home.itemResultCount"
        : viewMode === "nailArt"
          ? "home.nailArtResultCount"
          : "home.phoneCaseResultCount";

  const searchPlaceholder =
    viewMode === "phoneCase"
      ? t("home.searchPhoneCasePlaceholder")
      : t("home.searchPlaceholder");

  return (
    <div className="mb-5 space-y-3">
      <ViewModeTabs viewMode={viewMode} onViewModeChange={onViewModeChange} />

      {showSearch && (
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
            placeholder={searchPlaceholder}
            className={searchClass}
          />
        </div>
      )}

      <div>
        {filtersOpen && showCatalogFilters && (
          <div className="pt-4">
            <div className={`${filterScrollClass} gap-6 sm:gap-7`}>
              <MainFilterTab
                active={!typeFilter}
                label={t("home.filterAll")}
                onClick={() => onTypeChange("")}
              />
              {FILTER_TYPES.map((group) => (
                <MainFilterTab
                  key={group}
                  active={isMainActive(group)}
                  label={t(`itemTypeGroups.${group}`)}
                  onClick={() => handleMainClick(group)}
                />
              ))}
            </div>

            <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 border-b border-border bg-subtle py-2.5">
              <div className="mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-6">
                <div className={filterScrollClass}>
                {!activeGroup ? (
                  <SubFilterTab
                    active={!typeFilter}
                    label={t("home.filterAllCategories")}
                    onClick={() => onTypeChange("")}
                  />
                ) : showSyntheticSubTab ? (
                  <SubFilterTab
                    active={isSyntheticSubActive(activeGroup)}
                    label={t("home.filterGroupAll", {
                      group: t(`itemTypeGroups.${activeGroup}`),
                    })}
                    onClick={() => handleGroupAllClick(activeGroup)}
                  />
                ) : (
                  <>
                    <SubFilterTab
                      active={typeFilter === activeGroup}
                      label={t("home.filterGroupAll", {
                        group: t(`itemTypeGroups.${activeGroup}`),
                      })}
                      onClick={() => handleGroupAllClick(activeGroup)}
                    />
                    {subTypes!.map((sub) => (
                      <SubFilterTab
                        key={sub}
                        active={typeFilter === sub}
                        label={t(`itemTypes.${sub as ItemType}`)}
                        onClick={() => handleSubClick(sub)}
                      />
                    ))}
                  </>
                )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="shrink-0 text-sm text-neutral-600">
          {t(resultCountKey, { count: resultCount })}
        </p>
        <SelectMenu
          variant="icon"
          align="right"
          value={sort}
          onChange={(value) => onSortChange(value as HomeSort)}
          ariaLabel={t("home.sortLabel")}
          options={sortOptions.map((option) => ({
            value: option,
            label: t(`home.sort.${option}`),
          }))}
        />
      </div>
    </div>
  );
}
