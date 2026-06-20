"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import ItemCard from "./ItemCard";
import { brandHref } from "@/lib/brand";
import type { BrandRankingEntry, ItemRankingEntry } from "@/lib/rankings-types";

function RankBadge({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
      : rank === 2
        ? "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100"
        : rank === 3
          ? "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200"
          : "bg-subtle text-muted";

  return (
    <span
      className={`inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-2 text-xs font-semibold ${tone}`}
    >
      {rank}
    </span>
  );
}

export default function RankingsContent({
  topBrands,
  topItems,
}: {
  topBrands: BrandRankingEntry[];
  topItems: ItemRankingEntry[];
}) {
  const { t } = useTranslation();

  return (
    <div className="min-w-0">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          {t("rankings.title")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("rankings.desc")}</p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {t("rankings.topBrandsTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("rankings.topBrandsDesc")}</p>
        </div>

        {topBrands.length === 0 ? (
          <div className="rounded-xl bg-empty p-8 text-center">
            <p className="text-sm text-muted">{t("rankings.noBrands")}</p>
          </div>
        ) : (
          <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {topBrands.map((entry, index) => (
              <li key={entry.brandKey}>
                <Link
                  href={brandHref(entry.brand)}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-subtle sm:gap-4 sm:px-5"
                >
                  <RankBadge rank={index + 1} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                      {entry.brand}
                    </p>
                    <p className="mt-0.5 text-xs text-muted sm:text-sm">
                      {t("rankings.brandStats", {
                        itemCount: entry.itemCount,
                        useCount: entry.useCount,
                      })}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-10 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {t("rankings.topItemsTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("rankings.topItemsDesc")}</p>
        </div>

        {topItems.length === 0 ? (
          <div className="rounded-xl bg-empty p-8 text-center">
            <p className="text-sm text-muted">{t("rankings.noItems")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
            {topItems.map((item, index) => (
              <div key={item.id} className="relative min-w-0">
                <div className="absolute left-0 top-0 z-10 -translate-x-1 -translate-y-1">
                  <RankBadge rank={index + 1} />
                </div>
                <ItemCard
                  id={item.id}
                  image={item.image}
                  type={item.type}
                  brand={item.brand}
                  productName={item.productName}
                  useCount={item.useCount}
                  priority={index < 4}
                  imageQuality={72}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
