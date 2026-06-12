"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAssetUrl } from "@/lib/use-asset-url";
import { brandHref } from "@/lib/brand";
import { itemHref } from "@/lib/entity-href";
import { ITEM_TYPES, normalizeItemType } from "@/lib/types";
import FavoriteButton from "./FavoriteButton";
import ItemReport from "./ItemReport";
import ProgressiveImage from "./ProgressiveImage";

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
  "shrink-0 cursor-pointer rounded-full p-1.5 text-muted transition-colors hover:bg-subtle hover:text-foreground";

function ItemListRow({
  item,
  outfitId,
  outfitTitle,
}: {
  item: Item;
  outfitId: string;
  outfitTitle: string;
}) {
  const { t } = useTranslation();
  const typeKey = normalizeItemType(item.type);
  const imageSrc = useAssetUrl(item.image);

  return (
    <article className="detail-item-row">
      <div className="detail-item-thumb-wrap items-start">
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
            <ProgressiveImage
              src={imageSrc}
              uploadPath={item.image}
              alt={item.productName ?? t(`itemTypes.${typeKey}`)}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100px, 230px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-2 text-center text-[13px] leading-tight text-muted sm:text-base">
              {t(`itemTypes.${typeKey}`)}
            </div>
          )}
        </Link>
      </div>

      <div className="flex min-w-0 flex-1 flex-col self-stretch pl-4 sm:pl-5">
        <div className="detail-item-body flex min-h-[clamp(72px,9vw,168px)] min-w-0 flex-col justify-between">
          <div className="min-w-0 space-y-0">
            {item.brand && (
              <Link
                href={brandHref(item.brand)}
                prefetch={false}
                className="block w-fit max-w-full truncate text-sm font-medium uppercase tracking-wide text-muted decoration-muted/50 underline-offset-2 hover:text-foreground-secondary sm:text-sm"
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
                className="mt-0.5 block break-words text-[15px] font-semibold leading-tight text-foreground sm:mt-1 sm:text-xl sm:leading-snug"
              >
                {item.productName}
              </Link>
            )}
            <span className="mt-1 inline-block bg-subtle px-2 py-0.5 text-[12px] text-foreground-secondary sm:mt-1.5 sm:text-sm">
              {t(`itemTypes.${typeKey}`)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-0">
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
                <ExternalLinkIcon className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
              </a>
            ) : null}
            <FavoriteButton
              type="item"
              targetId={item.id}
              variant="plain"
              size="sm"
            />
            <ItemReport
              outfitId={outfitId}
              itemId={item.id}
              outfitTitle={outfitTitle}
              itemType={item.type}
              itemBrand={item.brand}
              itemProductName={item.productName}
              variant="icon"
              compact
            />
          </div>
        </div>

        {item.linkStatus === "dead" && item.officialLink && (
          <p className="mt-1.5 text-[13px] text-red-500 sm:text-base">
            {t("outfit.linkDead")}
          </p>
        )}
        {item.notes && (
          <p className="mt-1.5 break-words text-[13px] text-muted sm:mt-2 sm:text-base">
            {item.notes}
          </p>
        )}
      </div>
    </article>
  );
}

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
      {sortedItems.map((item) => (
        <ItemListRow
          key={item.id}
          item={item}
          outfitId={outfitId}
          outfitTitle={outfitTitle}
        />
      ))}
    </div>
  );
}
