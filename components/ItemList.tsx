"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { assetUrl } from "@/lib/asset-url";
import { cdnImageProps } from "@/lib/remote-image";
import { brandHref } from "@/lib/brand";
import { itemHref } from "@/lib/entity-href";
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

const actionBtnClass =
  "shrink-0 cursor-pointer rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900";

function ExternalLinkIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
    <div className="flex flex-col divide-y divide-border">
      {sortedItems.map((item) => {
        const typeKey = normalizeItemType(item.type);
        return (
          <article key={item.id} className="detail-item-row">
            <div className="detail-item-thumb-wrap">
              <Link
                href={itemHref({
                  id: item.id,
                  productName: item.productName,
                  brand: item.brand,
                  type: item.type,
                })}
                prefetch={false}
                className="detail-item-thumb item-image-surface block cursor-pointer transition-opacity hover:opacity-90"
              >
                {item.image ? (
                  <Image
                    src={assetUrl(item.image)}
                    alt={item.productName ?? t(`itemTypes.${typeKey}`)}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100px, 230px"
                    loading="lazy"
                    {...cdnImageProps()}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] leading-tight text-neutral-400">
                    {t(`itemTypes.${typeKey}`)}
                  </div>
                )}
              </Link>
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center py-3 pl-4 sm:pl-5">
              <div className="min-w-0 space-y-1">
                {item.brand && (
                  <Link
                    href={brandHref(item.brand)}
                    prefetch={false}
                    className="w-fit max-w-full truncate text-[11px] font-medium uppercase tracking-wide text-neutral-400 hover:text-neutral-600 hover:underline"
                  >
                    {item.brand}
                  </Link>
                )}
                {item.productName && (
                  <Link
                    href={itemHref({
                      id: item.id,
                      productName: item.productName,
                      brand: item.brand,
                      type: item.type,
                    })}
                    prefetch={false}
                    className="block break-words text-base font-semibold leading-snug text-neutral-900 hover:underline"
                  >
                    {item.productName}
                  </Link>
                )}
                <p className="text-sm text-neutral-500">
                  {t(`itemTypes.${typeKey}`)}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-0.5">
                {item.officialLink ? (
                  <a
                    href={item.officialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("outfit.openLink")}
                    className={`${actionBtnClass} ${
                      item.linkStatus === "dead" ? "text-red-500 hover:bg-red-50" : ""
                    }`}
                  >
                    <ExternalLinkIcon />
                  </a>
                ) : null}
                <FavoriteButton
                  type="item"
                  targetId={item.id}
                  variant="plain"
                />
                <ItemReport
                  outfitId={outfitId}
                  itemId={item.id}
                  outfitTitle={outfitTitle}
                  itemType={item.type}
                  itemBrand={item.brand}
                  itemProductName={item.productName}
                  variant="icon"
                />
              </div>

              {item.linkStatus === "dead" && item.officialLink && (
                <p className="mt-1 text-xs text-red-500">{t("outfit.linkDead")}</p>
              )}
              {item.notes && (
                <p className="mt-2 break-words text-xs text-muted">{item.notes}</p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
