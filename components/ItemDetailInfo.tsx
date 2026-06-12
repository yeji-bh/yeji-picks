"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAssetUrl } from "@/lib/use-asset-url";
import { brandHref } from "@/lib/brand";
import type { OutfitDisplayItem } from "@/lib/catalog-item";
import { useAuth } from "./AuthProvider";
import CatalogItemEditModal from "./CatalogItemEditModal";
import FavoriteButton from "./FavoriteButton";
import ProgressiveImage from "./ProgressiveImage";

function ItemExtraThumb({ url }: { url: string }) {
  const src = useAssetUrl(url);
  return (
    <div className="item-image-surface relative h-11 w-11 overflow-hidden rounded-md">
      <ProgressiveImage
        src={src}
        uploadPath={url}
        alt=""
        fill
        className="object-contain"
        sizes="44px"
      />
    </div>
  );
}

const actionBtnClass =
  "shrink-0 cursor-pointer rounded-full p-2 text-muted transition-colors hover:bg-subtle hover:text-foreground";

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

export default function ItemDetailInfo({
  item,
  onUpdated,
}: {
  item: OutfitDisplayItem;
  onUpdated?: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [editOpen, setEditOpen] = useState(false);
  const mainImageSrc = useAssetUrl(item.image);

  return (
    <>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-stretch sm:gap-8">
        <div className="mx-auto w-full max-w-[220px] shrink-0 sm:mx-0 sm:w-[200px]">
          <div className="item-image-surface relative aspect-square w-full overflow-hidden rounded-lg">
            {item.image ? (
              <ProgressiveImage
                src={mainImageSrc}
                uploadPath={item.image}
                alt={item.productName ?? t(`itemTypes.${item.type}`)}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 220px, 200px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-base text-muted">
                {t(`itemTypes.${item.type}`)}
              </div>
            )}
          </div>

          {item.images.length > 1 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {item.images.map((url) => (
                <ItemExtraThumb key={url} url={url} />
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 flex flex-1 flex-col self-stretch">
          <div className="flex flex-col justify-between gap-3 sm:min-h-[200px] sm:gap-0">
            <div className="min-w-0">
              <p className="text-base text-muted">{t(`itemTypes.${item.type}`)}</p>

              {item.productName && (
                <h1 className="mt-0.5 break-words text-xl font-semibold leading-snug text-foreground sm:mt-1 sm:text-2xl">
                  {item.productName}
                </h1>
              )}
              {item.brand && (
                <Link
                  href={brandHref(item.brand)}
                  className="mt-2 block w-fit max-w-full text-base font-medium uppercase tracking-wide text-muted hover:text-foreground-secondary hover:underline"
                >
                  {item.brand}
                </Link>
              )}
            </div>

            <div className="flex items-center justify-end gap-1">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="cursor-pointer rounded-lg border border-border px-2.5 py-1.5 text-base font-medium text-foreground-secondary hover:bg-subtle"
                >
                  {t("item.editCatalogBtn")}
                </button>
              )}
              {item.officialLink ? (
                <a
                  href={item.officialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("outfit.openLink")}
                  className={`${actionBtnClass} ${
                    item.linkStatus === "dead"
                      ? "text-red-500 hover:bg-red-50"
                      : ""
                  }`}
                >
                  <ExternalLinkIcon />
                </a>
              ) : null}
              <FavoriteButton type="item" targetId={item.id} variant="plain" />
            </div>
          </div>

          {item.linkStatus === "dead" && item.officialLink && (
            <p className="mt-3 text-base text-red-500">{t("outfit.linkDead")}</p>
          )}

          {item.notes && (
            <p className="mt-4 whitespace-pre-wrap text-base text-muted">{item.notes}</p>
          )}
        </div>
      </div>

      {isAdmin && (
        <CatalogItemEditModal
          itemId={item.id}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onUpdated={onUpdated}
        />
      )}
    </>
  );
}
