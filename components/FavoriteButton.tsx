"use client";

import { useTranslation } from "react-i18next";
import { useFavorites } from "./FavoritesProvider";

export default function FavoriteButton({
  type,
  targetId,
  className = "",
  variant = "overlay",
  size = "md",
}: {
  type: "outfit" | "item";
  targetId: string;
  className?: string;
  variant?: "overlay" | "inline";
  size?: "sm" | "md" | "lg";
}) {
  const { t } = useTranslation();
  const { isOutfitFavorite, isItemFavorite, toggleOutfit, toggleItem } =
    useFavorites();

  const active =
    type === "outfit"
      ? isOutfitFavorite(targetId)
      : isItemFavorite(targetId);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (type === "outfit") await toggleOutfit(targetId);
    else await toggleItem(targetId);
  }

  const paddingClass =
    size === "lg" ? "p-2.5" : size === "sm" ? "p-1" : "p-1.5";
  const inlineIconClass =
    size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  const overlayClass =
    "rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white";
  const inlineClass = `rounded-full ${paddingClass} transition-colors ${
    active
      ? "text-red-500 hover:bg-red-50"
      : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
  }`;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? t("favorites.unsave") : t("favorites.save")}
      className={`cursor-pointer ${variant === "inline" ? inlineClass : overlayClass} ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={variant === "inline" ? 2 : 1.5}
        className={
          variant === "overlay"
            ? `h-5 w-5 ${active ? "text-red-500" : "text-neutral-400"}`
            : inlineIconClass
        }
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
    </button>
  );
}
