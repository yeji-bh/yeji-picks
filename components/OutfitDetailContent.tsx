"use client";

import Link from "next/link";
import ProgressiveImage from "./ProgressiveImage";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ImageLightbox from "./ImageLightbox";
import OutfitItemsSection from "./OutfitItemsSection";
import OutfitReviewsSection from "./OutfitReviewsSection";
import { assetUrl } from "@/lib/asset-url";
import { syncMainBounds } from "@/lib/main-bounds";
import { COVER_DETAIL_CLASS } from "@/lib/image";
import { outfitHref } from "@/lib/entity-href";

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

function NavArrow({
  href,
  label,
  direction,
  className = "",
}: {
  href: string;
  label: string;
  direction: "prev" | "next";
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`fixed top-1/2 z-40 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-white p-2.5 text-neutral-600 shadow-md transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 lg:flex ${className}`}
    >
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        {direction === "prev" ? (
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </Link>
  );
}

export default function OutfitDetailContent({
  outfitId,
  outfitTitle,
  mainImage,
  imageAlt,
  items,
  newer,
  older,
}: {
  outfitId: string;
  outfitTitle: string;
  mainImage: string;
  imageAlt: string;
  items: Item[];
  newer: { id: string; date: string; eventName: string } | null;
  older: { id: string; date: string; eventName: string } | null;
}) {
  const { t } = useTranslation();
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    syncMainBounds();
    window.addEventListener("resize", syncMainBounds);
    return () => window.removeEventListener("resize", syncMainBounds);
  }, []);

  return (
    <>
      {newer && (
        <NavArrow
          href={outfitHref(newer)}
          label={t("outfit.newer")}
          direction="prev"
          className="left-3 xl:left-6"
        />
      )}
      {older && (
        <NavArrow
          href={outfitHref(older)}
          label={t("outfit.older")}
          direction="next"
          className="right-3 xl:right-6"
        />
      )}

      <div className="mt-4 grid gap-8 lg:mt-6 lg:grid-cols-[clamp(260px,24.74vw,475px)_minmax(0,1fr)] lg:items-stretch lg:justify-between lg:gap-x-12 xl:gap-x-16">
        <div className="detail-cover-column min-h-0 w-full lg:w-auto">
          <div className="detail-cover-sticky">
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              className={`group relative block w-full cursor-zoom-in overflow-hidden bg-neutral-100 ${COVER_DETAIL_CLASS}`}
              aria-label={t("outfit.zoomImage")}
            >
              <ProgressiveImage
                src={assetUrl(mainImage)}
                alt={imageAlt}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                sizes="475px"
              />
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <OutfitItemsSection
            items={items}
            outfitId={outfitId}
            outfitTitle={outfitTitle}
          />
        </div>
      </div>

      <div className="w-full">
        <OutfitReviewsSection outfitId={outfitId} />
      </div>

      <ImageLightbox
        src={assetUrl(mainImage)}
        alt={imageAlt}
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
      />
    </>
  );
}
