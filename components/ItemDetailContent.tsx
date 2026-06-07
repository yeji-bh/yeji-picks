"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { assetUrl } from "@/lib/asset-url";
import { brandHref } from "@/lib/brand";
import type { OutfitDisplayItem } from "@/lib/catalog-item";
import { useAuth } from "./AuthProvider";
import FavoriteButton from "./FavoriteButton";
import OutfitCard from "./OutfitCard";

type OutfitRef = {
  id: string;
  mainImage: string;
  eventName: string;
  date: string;
};

function ExternalLinkIcon({ className = "h-5 w-5" }: { className?: string }) {
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

export default function ItemDetailContent({
  item,
  outfits,
}: {
  item: OutfitDisplayItem;
  outfits: OutfitRef[];
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-w-0">
      <Link
        href="/"
        className="text-xs text-muted hover:text-neutral-900 sm:text-sm"
      >
        ← {t("item.backHome")}
      </Link>

      <div className="mt-4">
        <div className="flex items-start gap-4 sm:gap-6">
          <div className="w-[140px] shrink-0 sm:w-[180px]">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-white">
              {item.image ? (
                <Image
                  src={assetUrl(item.image)}
                  alt={item.productName ?? t(`itemTypes.${item.type}`)}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 640px) 140px, 180px"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted">
                  {t(`itemTypes.${item.type}`)}
                </div>
              )}
            </div>

            {item.images.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.images.map((url) => (
                  <div
                    key={url}
                    className="relative h-11 w-11 overflow-hidden rounded-lg border border-border bg-white"
                  >
                    <Image
                      src={assetUrl(url)}
                      alt=""
                      fill
                      className="object-contain p-0.5"
                      sizes="44px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted">{t(`itemTypes.${item.type}`)}</p>
                {item.productName && (
                  <h1 className="mt-1 text-lg font-semibold leading-snug text-neutral-900 sm:text-xl">
                    {item.productName}
                  </h1>
                )}
                {item.brand && (
                  <Link
                    href={brandHref(item.brand)}
                    className="mt-2 inline-block text-sm text-neutral-600 hover:text-neutral-900 hover:underline"
                  >
                    {item.brand}
                  </Link>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {isAdmin && (
                  <Link
                    href={`/item/${item.id}/edit`}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    {t("item.editCatalogBtn")}
                  </Link>
                )}
                {item.officialLink && (
                  <a
                    href={item.officialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("outfit.openLink")}
                    className={`rounded-full p-2 transition-colors ${
                      item.linkStatus === "dead"
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
                  size="lg"
                />
              </div>
            </div>

            {item.linkStatus === "dead" && item.officialLink && (
              <p className="mt-2 text-xs text-red-500">{t("outfit.linkDead")}</p>
            )}

            {item.notes && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-muted">
                {item.notes}
              </p>
            )}
          </div>
        </div>

        <section className="mt-6 border-t border-border pt-5">
          <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
            {t("item.outfitsSection")}
          </h2>
          {outfits.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{t("item.noOutfits")}</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {outfits.map((outfit) => (
                <OutfitCard
                  key={outfit.id}
                  id={outfit.id}
                  mainImage={outfit.mainImage}
                  eventName={outfit.eventName}
                  date={outfit.date}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
