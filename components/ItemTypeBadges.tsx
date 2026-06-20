"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ITEM_TYPES, normalizeItemType, type ItemType } from "@/lib/types";

const BADGE_CLASS =
  "shrink-0 rounded-none bg-subtle px-2.5 py-1 text-base font-medium text-foreground-secondary max-sm:px-2 max-sm:py-0.5 max-sm:text-[14px]";

const OVERFLOW_CLASS =
  "shrink-0 rounded-none bg-subtle px-2 py-1 text-base font-medium text-foreground-secondary max-sm:px-1.5 max-sm:py-0.5 max-sm:text-[14px]";

type BadgeLayout = {
  visibleCount: number;
  showOverflow: boolean;
};

function calcUsedWidth(
  widths: number[],
  count: number,
  hidden: number,
  gap: number,
  overflowSizer: HTMLElement
): number {
  let used = 0;

  for (let index = 0; index < count; index++) {
    if (index > 0) used += gap;
    used += widths[index] ?? 0;
  }

  if (hidden > 0) {
    if (count > 0) used += gap;
    overflowSizer.textContent = `${hidden}+`;
    used += overflowSizer.offsetWidth;
  }

  return used;
}

export default function ItemTypeBadges({
  types,
  className = "",
}: {
  types: string[];
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLDivElement>(null);
  const overflowSizerRef = useRef<HTMLSpanElement>(null);
  const [layout, setLayout] = useState<BadgeLayout>({
    visibleCount: 1,
    showOverflow: false,
  });

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

  const labels = useMemo(
    () => sorted.map((type) => t(`itemTypes.${type}`)),
    [sorted, t, i18n.language]
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    const sizer = sizerRef.current;
    const overflowSizer = overflowSizerRef.current;
    if (!container || !sizer || !overflowSizer || sorted.length === 0) {
      setLayout({ visibleCount: sorted.length, showOverflow: false });
      return;
    }

    const gap = Number.parseFloat(getComputedStyle(container).gap || "0") || 0;

    const measure = () => {
      const badgeEls = sizer.querySelectorAll<HTMLElement>("[data-sizer-badge]");
      if (badgeEls.length === 0) return;

      const widths = Array.from(badgeEls, (badge) => badge.offsetWidth);
      const available = container.clientWidth;
      let next: BadgeLayout = { visibleCount: 1, showOverflow: false };

      for (let count = sorted.length; count >= 1; count--) {
        const hidden = sorted.length - count;

        if (hidden > 0) {
          const usedWithOverflow = calcUsedWidth(
            widths,
            count,
            hidden,
            gap,
            overflowSizer
          );
          if (usedWithOverflow <= available + 1) {
            next = { visibleCount: count, showOverflow: true };
            break;
          }
        }

        const used = calcUsedWidth(widths, count, 0, gap, overflowSizer);
        if (used <= available + 1) {
          next = { visibleCount: count, showOverflow: false };
          break;
        }
      }

      setLayout((prev) =>
        prev.visibleCount === next.visibleCount &&
        prev.showOverflow === next.showOverflow
          ? prev
          : next
      );
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    sizer.querySelectorAll<HTMLElement>("[data-sizer-badge]").forEach((badge) => {
      observer.observe(badge);
    });

    if (document.fonts?.ready) {
      void document.fonts.ready.then(measure);
    }

    return () => observer.disconnect();
  }, [typesKey, i18n.language, sorted.length, labels.join("|")]);

  if (sorted.length === 0) return null;

  const shown = Math.min(layout.visibleCount, sorted.length);
  const hiddenCount = sorted.length - shown;
  const showOverflow = layout.showOverflow && hiddenCount > 0;
  const truncateSingle =
    shown === 1 && hiddenCount > 0 && !showOverflow;

  return (
    <div className={`relative min-w-0 ${className}`}>
      <div
        ref={sizerRef}
        aria-hidden
        className="pointer-events-none absolute -left-[9999px] top-0 flex flex-nowrap items-center gap-1.5 opacity-0"
      >
        {labels.map((label, index) => (
          <span key={`${label}-${index}`} data-sizer-badge className={BADGE_CLASS}>
            {label}
          </span>
        ))}
        <span ref={overflowSizerRef} className={OVERFLOW_CLASS}>
          99+
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden"
      >
        {sorted.map((type, index) => (
          <span
            key={type}
            className={`${BADGE_CLASS} ${truncateSingle && index === 0 ? "min-w-0 max-w-full truncate" : ""}`}
            style={{ display: index < shown ? undefined : "none" }}
          >
            {t(`itemTypes.${type}`)}
          </span>
        ))}
        {showOverflow && (
          <span className={OVERFLOW_CLASS}>{hiddenCount}+</span>
        )}
      </div>
    </div>
  );
}
