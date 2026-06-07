"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { assetUrl } from "@/lib/asset-url";
import { brandHref } from "@/lib/brand";
import { ITEM_TYPES, normalizeItemType } from "@/lib/types";
import FavoriteButton from "./FavoriteButton";
import ItemReport from "./ItemReport";

type Item = {
  id: string;
  type: string;
  brand: string | null;
  productName: string | null;
  image: string | null;
  officialLink: string | null;
  notes: string | null;
  linkStatus: string | null;
  useCount: number;
};

function ExternalLinkIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
    </svg>
  );
}

export default function ItemList({
  items,
  outfitId,
  outfitTitle,
}: {
  items: Item[];
  outfitId: string;
  outfitTitle: string;
}) {
  const { t } = useTranslation();

  const sortedItems = useMemo(() => {
    const typeIndex = new Map(ITEM_TYPES.map((type, index) => [type, index]));
    return [...items].sort((a, b) => {
      const aIndex = typeIndex.get(normalizeItemType(a.type)) ?? ITEM_TYPES.length;
      const bIndex = typeIndex.get(normalizeItemType(b.type)) ?? ITEM_TYPES.length;
      return aIndex - bIndex;
    });
  }, [items]);

  if (sortedItems.length === 0) {
    return <p className="text-sm text-muted">{t("outfit.noItems")}</p>;
  }

  return (
    <div className="flex flex-col gap-2 divide-y divide-border">
      {sortedItems.map((item) => {
        const typeKey = normalizeItemType(item.type);
        return (
          <article key={item.id} className="detail-item-row">
            <div className="detail-item-thumb-wrap">
              <Link
                href={`/item/${item.id}`}
                className="detail-item-thumb block cursor-pointer transition-opacity hover:opacity-90"
              >
                {item.image ? (
                  <Image
                    src={assetUrl(item.image)}
                    alt={item.productName ?? t(`itemTypes.${typeKey}`)}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100px, 230px"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] leading-tight text-neutral-400">
                    {t(`itemTypes.${typeKey}`)}
                  </div>
                )}
              </Link>
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-2.5 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted sm:text-sm">
                    {t(`itemTypes.${typeKey}`)}
                  </p>
                  {item.brand && (
                    <Link
                      href={brandHref(item.brand)}
                      className="mt-1.5 block text-xs text-neutral-600 hover:text-neutral-900 hover:underline sm:text-sm"
                    >
                      {item.brand}
                    </Link>
                  )}
                  {item.productName && (
                    <Link
                      href={`/item/${item.id}`}
                      className="mt-1 block break-words text-sm font-medium leading-snug text-neutral-900 hover:underline sm:text-base"
                    >
                      {item.productName}
                    </Link>
                  )}
                  {item.useCount > 0 && (
                    <Link
                      href={`/item/${item.id}`}
                      className="mt-1 block text-[11px] text-muted hover:text-neutral-900 hover:underline"
                    >
                      {t("item.useCount", { count: item.useCount })}
                    </Link>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {item.officialLink && (
                    <a
                      href={item.officialLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("outfit.openLink")}
                      className={`rounded-full p-1.5 transition-colors ${item.linkStatus === "dead"
                          ? "text-red-500 hover:bg-red-50"
                          : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                        }`}
                    >
                      <ExternalLinkIcon />
                    </a>
                  )}
                  <FavoriteButton
                    type="item"
                    targetId={item.id}
                    variant="inline"
                  />
                </div>
              </div>

              {item.linkStatus === "dead" && item.officialLink && (
                <p className="mt-1 text-xs text-red-500">{t("outfit.linkDead")}</p>
              )}
              {item.notes && (
                <p className="mt-2 break-words text-xs text-muted">{item.notes}</p>
              )}
              <div className="mt-2">
                <ItemReport
                  outfitId={outfitId}
                  itemId={item.id}
                  outfitTitle={outfitTitle}
                  itemType={item.type}
                  itemBrand={item.brand}
                  itemProductName={item.productName}
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
