"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAssetUrl } from "@/lib/use-asset-url";
import { brandHref } from "@/lib/brand";
import { itemHref } from "@/lib/entity-href";
import FavoriteButton from "./FavoriteButton";
import ProgressiveImage from "./ProgressiveImage";
import { saveHomeScrollIfHome } from "@/lib/home-scroll";
import { GRID_IMAGE_QUALITY, GRID_IMAGE_SIZES } from "@/lib/grid-image";

type ItemCardProps = {
  id: string;
  image: string | null;
  type: string;
  brand: string | null;
  productName: string | null;
  useCount: number;
  priority?: boolean;
  imageQuality?: number;
};

export default function ItemCard({
  id,
  image,
  type,
  brand,
  productName,
  priority = false,
  imageQuality = GRID_IMAGE_QUALITY,
}: ItemCardProps) {
  const { t } = useTranslation();
  const typeLabel = t(`itemTypes.${type}`);
  const detailHref = itemHref({ id, productName, brand, type });
  const imageSrc = useAssetUrl(image);

  return (
    <article className="group min-w-0">
      <Link
        href={detailHref}
        prefetch={false}
        onClick={() => saveHomeScrollIfHome()}
        className="item-image-surface relative block aspect-[3/4] w-full overflow-hidden"
      >
        {image ? (
          <ProgressiveImage
            src={imageSrc}
            uploadPath={image}
            alt={productName ?? typeLabel}
            fill
            priority={priority}
            quality={imageQuality}
            className="object-contain"
            sizes={GRID_IMAGE_SIZES}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-muted">
            {typeLabel}
          </div>
        )}
      </Link>
      <div className="mt-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-0.5">
            <Link
              href={detailHref}
              prefetch={false}
              onClick={() => saveHomeScrollIfHome()}
              className="block text-xs text-muted hover:text-foreground-secondary hover:underline"
            >
              {typeLabel}
            </Link>
            {brand && (
              <Link
                href={brandHref(brand)}
                prefetch={false}
                className="block break-words text-sm font-bold leading-snug text-foreground line-clamp-2 hover:underline"
              >
                {brand}
              </Link>
            )}
            {productName && (
              <Link
                href={detailHref}
                prefetch={false}
                onClick={() => saveHomeScrollIfHome()}
                className="block break-words text-base leading-snug text-foreground line-clamp-2 hover:underline sm:text-[17px]"
              >
                {productName}
              </Link>
            )}
          </div>
          <FavoriteButton type="item" targetId={id} variant="inline" size="md" />
        </div>
      </div>
    </article>
  );
}
