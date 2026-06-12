"use client";

import { useTranslation } from "react-i18next";
import type { HomeViewMode } from "@/lib/home-view-mode";

function ViewModeTab({
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
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative shrink-0 cursor-pointer pb-2.5 text-1rem font-medium transition-colors ${
        active ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-600"
      }`}
    >
      {label}
      {active && (
        <span
          className="absolute bottom-0 left-0 h-0.5 w-full bg-neutral-900"
          aria-hidden
        />
      )}
    </button>
  );
}

export default function ViewModeTabs({
  viewMode,
  onViewModeChange,
}: {
  viewMode: HomeViewMode;
  onViewModeChange: (mode: HomeViewMode) => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="flex gap-6 border-b border-border"
      role="tablist"
      aria-label={t("home.viewModeLabel")}
    >
      <ViewModeTab
        active={viewMode === "outfit"}
        label={t("home.modeOutfit")}
        onClick={() => onViewModeChange("outfit")}
      />
      <ViewModeTab
        active={viewMode === "item"}
        label={t("home.modeItem")}
        onClick={() => onViewModeChange("item")}
      />
    </div>
  );
}
