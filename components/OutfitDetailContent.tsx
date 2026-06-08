"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ImageLightbox from "./ImageLightbox";
import OutfitItemsSection from "./OutfitItemsSection";
import OutfitReviewsSection from "./OutfitReviewsSection";
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
  const gridRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const itemsColumnRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const coverStateRef = useRef({
    mode: "static" as CoverMode,
    height: 0,
    left: 0,
    top: 0,
    width: 0,
  });
  const [coverMode, setCoverMode] = useState<CoverMode>("static");
  const [coverFixedStyle, setCoverFixedStyle] = useState<CoverFixedStyle | null>(null);
  const [coverHeight, setCoverHeight] = useState(0);

  useEffect(() => {
    syncMainBounds();
    window.addEventListener("resize", syncMainBounds);
    return () => window.removeEventListener("resize", syncMainBounds);
  }, []);

  useEffect(() => {
    const coverEl = coverRef.current;
    if (!coverEl) return;

    const mq = window.matchMedia(DESKTOP_MQ);
    let frame = 0;

    function applyCoverState(
      mode: CoverMode,
      fixed: CoverFixedStyle | null,
      height: number
    ) {
      const prev = coverStateRef.current;
      const nextLeft = fixed?.left ?? 0;
      const nextTop = fixed?.top ?? 0;
      const nextWidth = fixed?.width ?? 0;
      if (
        prev.mode === mode &&
        prev.height === height &&
        prev.left === nextLeft &&
        prev.top === nextTop &&
        prev.width === nextWidth
      ) {
        return;
      }
      coverStateRef.current = {
        mode,
        height,
        left: nextLeft,
        top: nextTop,
        width: nextWidth,
      };
      setCoverMode(mode);
      setCoverFixedStyle(fixed);
      setCoverHeight(height);
    }

    function updateCoverPosition() {
      const cover = coverRef.current;
      const column = columnRef.current;
      const itemsColumn = itemsColumnRef.current;
      const reviews = reviewsRef.current;
      if (!cover || !column) return;

      if (!mq.matches) {
        applyCoverState("static", null, 0);
        return;
      }

      const height = cover.offsetHeight;
      const columnRect = column.getBoundingClientRect();
      const itemsRect = itemsColumn?.getBoundingClientRect();
      const reviewsRect = reviews?.getBoundingClientRect();
      const top = Math.max(16, (window.innerHeight - height) / 2);
      const bottomLimit = top + height;

      // 單品列表或評論區進入視窗底部 — 完全停用 fixed，避免捲動回彈
      if (
        (itemsRect && itemsRect.bottom <= window.innerHeight + 8) ||
        (reviewsRect && reviewsRect.top <= window.innerHeight)
      ) {
        applyCoverState("static", null, 0);
        return;
      }

      if (columnRect.top >= top) {
        applyCoverState("static", null, 0);
      } else if (columnRect.bottom <= bottomLimit) {
        applyCoverState("bottom", null, 0);
      } else {
        applyCoverState("fixed", {
          left: columnRect.left,
          top,
          width: columnRect.width,
        }, height);
      }
    }

    function scheduleUpdate() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateCoverPosition();
      });
    }

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    const ro = new ResizeObserver(scheduleUpdate);
    ro.observe(coverEl);
    const itemsColumnEl = itemsColumnRef.current;
    const reviewsEl = reviewsRef.current;
    if (itemsColumnEl) ro.observe(itemsColumnEl);
    if (reviewsEl) ro.observe(reviewsEl);

    mq.addEventListener("change", scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      mq.removeEventListener("change", scheduleUpdate);
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

      <div
        ref={gridRef}
        className="mt-4 grid gap-8 lg:mt-6 lg:grid-cols-[clamp(260px,24.74vw,475px)_minmax(0,1fr)] lg:items-start lg:justify-between lg:gap-x-12 xl:gap-x-16"
      >
        <div ref={columnRef} className="detail-cover-column min-h-0 w-full lg:w-auto lg:self-start">
          {(coverMode === "fixed" || coverMode === "bottom") && coverHeight > 0 ? (
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

        <div ref={itemsColumnRef} className="min-w-0">
          <OutfitItemsSection
            items={items}
            outfitId={outfitId}
            outfitTitle={outfitTitle}
          />
        </div>
      </div>

      <div ref={reviewsRef} className="w-full">
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
