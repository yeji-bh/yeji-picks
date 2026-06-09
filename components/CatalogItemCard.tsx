"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { assetUrl } from "@/lib/asset-url";
import { cdnImageProps } from "@/lib/remote-image";
import { itemHref } from "@/lib/entity-href";
import FavoriteButton from "./FavoriteButton";

type CatalogItemCardProps = {
  id: string;
  image: string | null;
  type: string;
  brand: string | null;
  productName: string | null;
  useCount: number;
};

export default function CatalogItemCard({
  id,
  image,
  type,
  brand,
  productName,
  useCount,
}: CatalogItemCardProps) {
  const { t } = useTranslation();

  return (
    <Link
      href={itemHref({ id, productName, brand, type })}
      prefetch={false}
      className="group block min-w-0 overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        {image ? (
          <Image
            src={assetUrl(image)}
            alt={productName ?? t(`itemTypes.${type}`)}
            fill
            className="object-contain p-2 transition-transform duration-200 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            {...cdnImageProps()}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-neutral-400">
            {t(`itemTypes.${type}`)}
          </div>
        )}
        <div className="absolute right-2 top-2">
          <FavoriteButton type="item" targetId={id} />
        </div>
      </div>
      <div className="space-y-1 p-2.5 sm:p-3">
        <p className="text-[11px] text-muted">{t(`itemTypes.${type}`)}</p>
        {productName && (
          <p className="break-words text-sm font-medium leading-snug text-neutral-900 line-clamp-2">
            {productName}
          </p>
        )}
        {brand && (
          <p className="truncate text-xs text-neutral-600">{brand}</p>
        )}
        {useCount > 0 && (
          <p className="text-[11px] text-muted">
            {t("item.useCount", { count: useCount })}
          </p>
        )}
      </div>
    </Link>
  );
}
