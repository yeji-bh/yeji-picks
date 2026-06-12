"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { assetUrl } from "@/lib/asset-url";
import { brandHref } from "@/lib/brand";
import type { OutfitDisplayItem } from "@/lib/catalog-item";
import { useAuth } from "./AuthProvider";
import CatalogItemEditModal from "./CatalogItemEditModal";
import FavoriteButton from "./FavoriteButton";
import ProgressiveImage from "./ProgressiveImage";

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

  return (
    <>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
        <div className="mx-auto w-full max-w-[220px] shrink-0 sm:mx-0 sm:w-[200px]">
          <div className="item-image-surface relative aspect-square w-full overflow-hidden rounded-lg">
            {item.image ? (
              <ProgressiveImage
                src={assetUrl(item.image)}
                alt={item.productName ?? t(`itemTypes.${item.type}`)}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 220px, 200px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                {t(`itemTypes.${item.type}`)}
              </div>
            )}
          </div>

          {item.images.length > 1 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {item.images.map((url) => (
                <div
                  key={url}
                  className="item-image-surface relative h-11 w-11 overflow-hidden rounded-md"
                >
                  <ProgressiveImage
                    src={assetUrl(url)}
                    alt=""
                    fill
                    className="object-contain"
                    sizes="44px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-neutral-500">{t(`itemTypes.${item.type}`)}</p>
              {item.productName && (
                <h1 className="mt-1 break-words text-xl font-semibold leading-snug text-neutral-900 sm:text-2xl">
                  {item.productName}
                </h1>
              )}
              {item.brand && (
                <Link
                  href={brandHref(item.brand)}
                  className="mt-2 w-fit max-w-full text-sm font-medium uppercase tracking-wide text-neutral-500 hover:text-neutral-800 hover:underline"
                >
                  {item.brand}
                </Link>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="cursor-pointer rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 sm:text-sm"
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
            <p className="mt-3 text-xs text-red-500">{t("outfit.linkDead")}</p>
          )}

          {item.notes && (
            <p className="mt-4 whitespace-pre-wrap text-sm text-muted">{item.notes}</p>
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
