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
        active ? "text-accent" : "text-inactive hover:text-foreground-secondary"
      }`}
    >
      {label}
      {active && (
        <span
          className="absolute bottom-0 left-0 h-0.5 w-full bg-accent"
          aria-hidden
        />
      )}
    </button>
  );
}

const VIEW_MODES: HomeViewMode[] = [
  "outfit",
  "item",
  "nailArt",
  "phoneCase",
  "perfume",
];

const MODE_LABEL_KEYS: Record<HomeViewMode, string> = {
  outfit: "home.modeOutfit",
  item: "home.modeItem",
  nailArt: "home.modeNailArt",
  phoneCase: "home.modePhoneCase",
  perfume: "home.modePerfume",
};

export default function ViewModeTabs({
  viewMode,
  onViewModeChange,
  modes = VIEW_MODES,
}: {
  viewMode: HomeViewMode;
  onViewModeChange: (mode: HomeViewMode) => void;
  modes?: HomeViewMode[];
}) {
  const { t } = useTranslation();

  return (
    <div
      className="flex gap-6 overflow-x-auto border-b border-border [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label={t("home.viewModeLabel")}
    >
      {modes.map((mode) => (
        <ViewModeTab
          key={mode}
          active={viewMode === mode}
          label={t(MODE_LABEL_KEYS[mode])}
          onClick={() => onViewModeChange(mode)}
        />
      ))}
    </div>
  );
}
