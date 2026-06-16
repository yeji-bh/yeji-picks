"use client";

import { useTranslation } from "react-i18next";
import { IconHeart } from "./NavIcons";
import { useFavorites } from "./FavoritesProvider";

const FAVORITE_COLOR = "text-favorite";

export default function FavoriteButton({
  type,
  targetId,
  className = "",
  variant = "overlay",
  overlayTone = "light",
  size = "md",
}: {
  type: "outfit" | "item" | "nailArt" | "phoneCase";
  targetId: string;
  className?: string;
  variant?: "overlay" | "inline" | "plain";
  overlayTone?: "light" | "muted";
  size?: "sm" | "md" | "lg";
}) {
  const { t } = useTranslation();
  const {
    isOutfitFavorite,
    isItemFavorite,
    isNailArtFavorite,
    isPhoneCaseFavorite,
    toggleOutfit,
    toggleItem,
    toggleNailArt,
    togglePhoneCase,
  } = useFavorites();

  const active =
    type === "outfit"
      ? isOutfitFavorite(targetId)
      : type === "item"
        ? isItemFavorite(targetId)
        : type === "nailArt"
          ? isNailArtFavorite(targetId)
          : isPhoneCaseFavorite(targetId);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (type === "outfit") await toggleOutfit(targetId);
    else if (type === "item") await toggleItem(targetId);
    else if (type === "nailArt") await toggleNailArt(targetId);
    else await togglePhoneCase(targetId);
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
    active ? FAVORITE_COLOR : "text-inactive hover:text-favorite"
  }`;
  const plainClass = `shrink-0 rounded-full ${size === "sm" ? "p-1.5" : "p-2"} transition-colors ${
    active ? FAVORITE_COLOR : "text-inactive hover:text-favorite"
  }`;

  const variantClass =
    variant === "plain"
      ? plainClass
      : variant === "inline"
        ? inlineClass
        : overlayClass;

  const plainIconClass =
    size === "sm" ? "h-[18px] w-[18px]" : "h-5 w-5";
  const iconClass =
    variant === "overlay"
      ? `h-5 w-5 ${active ? FAVORITE_COLOR : "text-inactive"}`
      : variant === "plain"
        ? `${plainIconClass} ${active ? FAVORITE_COLOR : "text-inactive"}`
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
