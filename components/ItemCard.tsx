"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { assetUrl } from "@/lib/asset-url";
import { cdnImageProps } from "@/lib/remote-image";
import { brandHref } from "@/lib/brand";
import { itemHref } from "@/lib/entity-href";
import FavoriteButton from "./FavoriteButton";
import { saveHomeScrollIfHome } from "@/lib/home-scroll";

type ItemCardProps = {
  id: string;
  image: string | null;
  type: string;
  brand: string | null;
  productName: string | null;
  useCount: number;
};

export default function ItemCard({
  id,
  image,
  type,
  brand,
  productName,
}: ItemCardProps) {
  const { t } = useTranslation();
  const typeLabel = t(`itemTypes.${type}`);

  return (
    <article className="group min-w-0">
      <Link
        href={itemHref({ id, productName, brand, type })}
        prefetch={false}
        onClick={() => saveHomeScrollIfHome()}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-neutral-50"
      >
        {image ? (
          <Image
            src={assetUrl(image)}
            alt={productName ?? typeLabel}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            {...cdnImageProps()}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-neutral-400">
            {typeLabel}
          </div>
        )}
      </Link>
      <div className="mt-2.5 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-xs text-neutral-500">{typeLabel}</p>
            {brand && (
              <Link
                href={brandHref(brand)}
                prefetch={false}
                className="block truncate text-sm font-bold text-neutral-900 hover:underline"
              >
                {brand}
              </Link>
            )}
          </div>
          <FavoriteButton type="item" targetId={id} variant="inline" size="md" />
        </div>
        {productName && (
          <Link
            href={itemHref({ id, productName, brand, type })}
            prefetch={false}
            onClick={() => saveHomeScrollIfHome()}
            className="block break-words text-base leading-snug text-neutral-800 line-clamp-2 hover:underline sm:text-[17px]"
          >
            {productName}
          </Link>
        )}
      </div>
    </article>
  );
}
