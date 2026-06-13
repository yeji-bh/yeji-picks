"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ITEM_TYPES, normalizeItemType, type ItemType } from "@/lib/types";

const MOBILE_MAX_BADGES = 2;

const BADGE_CLASS =
  "shrink-0 rounded-none bg-subtle px-2.5 py-1 text-base font-medium text-foreground-secondary max-sm:px-2 max-sm:py-0.5 max-sm:text-[14px]";

const OVERFLOW_CLASS =
  "shrink-0 rounded-none bg-subtle px-2 py-1 text-base font-medium text-foreground-secondary max-sm:px-1.5 max-sm:py-0.5 max-sm:text-[14px]";

function useIsMobileLayout(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export default function ItemTypeBadges({
  types,
  className = "",
  compact = false,
}: {
  types: string[];
  className?: string;
  /** Skip scrollWidth measurement (home grid cards). */
  compact?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const isMobile = useIsMobileLayout();

  const stableTypesInput = [...new Set(types.map(normalizeItemType))]
    .sort()
    .join(",");

  const typesKey = useMemo(() => {
    const normalized = new Set(stableTypesInput.split(",").filter(Boolean));
    return ITEM_TYPES.filter((type) => normalized.has(type)).join(",");
  }, [stableTypesInput]);

  const sorted = useMemo(
    () => typesKey.split(",").filter(Boolean) as ItemType[],
    [typesKey]
  );

  useLayoutEffect(() => {
    if (compact || isMobile) {
      setVisibleCount(Math.min(MOBILE_MAX_BADGES, sorted.length));
      return;
    }

    const el = containerRef.current;
    if (!el || sorted.length === 0) {
      setVisibleCount((prev) => (prev === sorted.length ? prev : sorted.length));
      return;
    }

    const measure = () => {
      const badges = el.querySelectorAll<HTMLElement>("[data-type-badge]");
      const overflow = el.querySelector<HTMLElement>("[data-type-overflow]");
      if (!overflow || badges.length === 0) return;

      let fit = 0;
      for (let count = sorted.length; count >= 0; count--) {
        badges.forEach((badge, index) => {
          badge.style.display = index < count ? "" : "none";
        });

        const hidden = sorted.length - count;
        if (hidden > 0) {
          overflow.textContent = `${hidden}+`;
          overflow.style.display = "";
        } else {
          overflow.style.display = "none";
        }

        if (el.scrollWidth <= el.clientWidth + 1) {
          fit = count;
          break;
        }
      }

      badges.forEach((badge) => {
        badge.style.display = "";
      });

      setVisibleCount((prev) => (prev === fit ? prev : fit));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [typesKey, i18n.language, sorted.length, isMobile, compact]);

  if (sorted.length === 0) return null;

  const shown = visibleCount ?? 0;
  const overflow = Math.max(0, sorted.length - shown);

  return (
    <div
      ref={containerRef}
      className={`flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden ${className}`}
    >
      {sorted.map((type, index) => (
        <span
          key={type}
          data-type-badge
          className={`${BADGE_CLASS} ${index >= shown ? "hidden" : ""}`}
        >
          {t(`itemTypes.${type}`)}
        </span>
      ))}
      <span
        data-type-overflow
        className={`${OVERFLOW_CLASS} ${overflow > 0 ? "" : "hidden"}`}
      >
        {overflow > 0 ? `${overflow}+` : ""}
      </span>
    </div>
  );
}
