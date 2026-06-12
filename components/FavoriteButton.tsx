"use client";

import { useTranslation } from "react-i18next";
import { IconHeart } from "./NavIcons";
import { useFavorites } from "./FavoritesProvider";

const FAVORITE_COLOR = "text-[#F85580]";

export default function FavoriteButton({
  type,
  targetId,
  className = "",
  variant = "overlay",
  overlayTone = "light",
  size = "md",
}: {
  type: "outfit" | "item";
  targetId: string;
  className?: string;
  variant?: "overlay" | "inline" | "plain";
  overlayTone?: "light" | "muted";
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
    size === "lg" ? "h-6 w-6" : size === "sm" ? "h-[18px] w-[18px]" : "h-5 w-5";

  const overlayClass =
    overlayTone === "muted"
      ? "rounded-full bg-subtle p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
      : "rounded-full bg-card p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.14)]";
  const inlineClass = `shrink-0 -mt-1 ${paddingClass} transition-colors ${
    active ? FAVORITE_COLOR : "text-inactive hover:text-[#F85580]"
  }`;
  const plainClass = `shrink-0 rounded-full p-2 transition-colors ${
    active ? FAVORITE_COLOR : "text-inactive hover:text-[#F85580]"
  }`;

  const variantClass =
    variant === "plain"
      ? plainClass
      : variant === "inline"
        ? inlineClass
        : overlayClass;

  const iconClass =
    variant === "overlay" || variant === "plain"
      ? `h-5 w-5 ${active ? FAVORITE_COLOR : "text-inactive"}`
      : `${inlineIconClass} ${active ? FAVORITE_COLOR : ""}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? t("favorites.unsave") : t("favorites.save")}
      className={`cursor-pointer ${variantClass} ${className}`}
    >
      <IconHeart
        className={iconClass}
        filled={active}
        strokeWidth={variant === "inline" ? 1.75 : 1.5}
      />
    </button>
  );
}
