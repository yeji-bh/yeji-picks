"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ImageLightbox from "./ImageLightbox";
import OutfitItemsSection from "./OutfitItemsSection";
import { assetUrl } from "@/lib/asset-url";
import { syncMainBounds } from "@/lib/main-bounds";
import { COVER_DETAIL_CLASS } from "@/lib/image";

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

type CoverMode = "static" | "fixed" | "bottom";

type CoverFixedStyle = {
  left: number;
  top: number;
  width: number;
};

const DESKTOP_MQ = "(min-width: 1024px)";

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
  newerId,
  olderId,
}: {
  outfitId: string;
  outfitTitle: string;
  mainImage: string;
  imageAlt: string;
  items: Item[];
  newerId: string | null;
  olderId: string | null;
}) {
  const { t } = useTranslation();
  const [zoomOpen, setZoomOpen] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const [coverMode, setCoverMode] = useState<CoverMode>("static");
  const [coverFixedStyle, setCoverFixedStyle] = useState<CoverFixedStyle | null>(null);
  const [coverHeight, setCoverHeight] = useState(0);

  useEffect(() => {
    syncMainBounds();
    window.addEventListener("resize", syncMainBounds);
    return () => window.removeEventListener("resize", syncMainBounds);
  }, []);

  useEffect(() => {
    const column = columnRef.current;
    const cover = coverRef.current;
    if (!column || !cover) return;

    const mq = window.matchMedia(DESKTOP_MQ);

    function updateCoverPosition() {
      if (!mq.matches) {
        setCoverMode("static");
        setCoverFixedStyle(null);
        setCoverHeight(0);
        return;
      }

      const height = cover!.offsetHeight;
      setCoverHeight(height);

      const columnRect = column!.getBoundingClientRect();
      const top = Math.max(16, (window.innerHeight - height) / 2);
      const bottomLimit = top + height;

      if (columnRect.top >= top) {
        setCoverMode("static");
        setCoverFixedStyle(null);
      } else if (columnRect.bottom <= bottomLimit) {
        setCoverMode("bottom");
        setCoverFixedStyle(null);
      } else {
        setCoverMode("fixed");
        setCoverFixedStyle({
          left: columnRect.left,
          top,
          width: columnRect.width,
        });
      }
    }

    updateCoverPosition();
    window.addEventListener("scroll", updateCoverPosition, { passive: true });
    window.addEventListener("resize", updateCoverPosition);

    const ro = new ResizeObserver(updateCoverPosition);
    ro.observe(cover);
    ro.observe(column);

    mq.addEventListener("change", updateCoverPosition);

    return () => {
      window.removeEventListener("scroll", updateCoverPosition);
      window.removeEventListener("resize", updateCoverPosition);
      mq.removeEventListener("change", updateCoverPosition);
      ro.disconnect();
    };
  }, [mainImage]);

  const coverPositionStyle: React.CSSProperties | undefined =
    coverMode === "fixed" && coverFixedStyle
      ? {
          position: "fixed",
          left: coverFixedStyle.left,
          top: coverFixedStyle.top,
          width: coverFixedStyle.width,
        }
      : coverMode === "bottom"
        ? {
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
          }
        : undefined;

  return (
    <>
      {newerId && (
        <NavArrow
          href={`/outfit/${newerId}`}
          label={t("outfit.newer")}
          direction="prev"
          className="left-3 xl:left-6"
        />
      )}
      {olderId && (
        <NavArrow
          href={`/outfit/${olderId}`}
          label={t("outfit.older")}
          direction="next"
          className="right-3 xl:right-6"
        />
      )}

      <div className="mt-4 grid gap-8 lg:mt-6 lg:grid-cols-[clamp(260px,24.74vw,475px)_minmax(0,1fr)] lg:justify-between lg:gap-x-12 xl:gap-x-16">
        <div ref={columnRef} className="detail-cover-column min-h-0 w-full lg:w-auto">
          {coverMode === "fixed" && coverHeight > 0 ? (
            <div aria-hidden className="w-full" style={{ height: coverHeight }} />
          ) : null}
          <div
            ref={coverRef}
            className={`detail-cover-sticky${coverMode === "fixed" ? " is-fixed" : ""}`}
            style={coverPositionStyle}
          >
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              className={`group relative block w-full cursor-zoom-in overflow-hidden bg-neutral-100 ${COVER_DETAIL_CLASS}`}
              aria-label={t("outfit.zoomImage")}
            >
              <Image
                src={assetUrl(mainImage)}
                alt={imageAlt}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                sizes="475px"
                priority
              />
            </button>
          </div>
        </div>

        <OutfitItemsSection
          items={items}
          outfitId={outfitId}
          outfitTitle={outfitTitle}
        />
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
