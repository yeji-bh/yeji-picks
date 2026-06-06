"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import CatalogItemCard from "./CatalogItemCard";

type BrandItem = {
  id: string;
  type: string;
  brand: string | null;
  productName: string | null;
  image: string | null;
  useCount: number;
};

export default function BrandDetailContent({
  brand,
  items,
}: {
  brand: string;
  items: BrandItem[];
}) {
  const { t } = useTranslation();

  return (
    <div className="min-w-0">
      <Link
        href="/"
        className="text-xs text-muted hover:text-neutral-900 sm:text-sm"
      >
        ← {t("brand.backHome")}
      </Link>

      <header className="mt-4">
        <p className="text-sm text-muted">{t("brand.label")}</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-900 sm:text-2xl">
          {brand}
        </h1>
        <p className="mt-2 text-xs text-muted">
          {t("brand.itemCount", { count: items.length })}
        </p>
      </header>

      <section className="mt-8">
        {items.length === 0 ? (
          <p className="text-sm text-muted">{t("brand.noItems")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <CatalogItemCard
                key={item.id}
                id={item.id}
                image={item.image}
                type={item.type}
                brand={item.brand}
                productName={item.productName}
                useCount={item.useCount}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
