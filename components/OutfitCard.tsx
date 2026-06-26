"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAssetUrl } from "@/lib/use-asset-url";
import { COVER_ASPECT_CLASS } from "@/lib/image";
import { GRID_IMAGE_QUALITY, GRID_IMAGE_SIZES, GRID_IMAGE_WIDTH } from "@/lib/grid-image";
import { outfitHref } from "@/lib/entity-href";
import { formatOutfitTitle } from "@/lib/outfit";
import FavoriteButton from "./FavoriteButton";
import ItemTypeBadges from "./ItemTypeBadges";
import ProgressiveImage from "./ProgressiveImage";
import { saveHomeScrollIfHome } from "@/lib/home-scroll";
import { prefetchOutfitDetail } from "@/lib/outfit-detail-cache";

type OutfitCardProps = {
  id: string;
  mainImage: string;
  eventName: string;
  date: string;
  itemTypes?: string[];
  priority?: boolean;
  imageQuality?: number;
};

export default function OutfitCard({
  id,
  mainImage,
  eventName,
  date,
  itemTypes = [],
  priority = false,
  imageQuality = GRID_IMAGE_QUALITY,
}: OutfitCardProps) {
  const { t } = useTranslation();
  const title = formatOutfitTitle(date, eventName);
  const displayTitle = title === "outfit" ? t("outfit.unnamed") : title;
  const mainImageSrc = useAssetUrl(mainImage);

  const detailHref = outfitHref({ id, date, eventName });
  const prefetchDetail = () => void prefetchOutfitDetail(id);

  return (
    <article className="group min-w-0">
      <Link
        href={detailHref}
        onClick={() => saveHomeScrollIfHome()}
        onMouseEnter={prefetchDetail}
        onFocus={prefetchDetail}
        className="block"
      >
        <div className={`relative w-full overflow-hidden bg-cover ${COVER_ASPECT_CLASS}`}>
          <ProgressiveImage
            src={mainImageSrc}
            uploadPath={mainImage}
            alt={displayTitle}
            fill
            priority={priority}
            quality={imageQuality}
            className="object-cover"
            sizes={GRID_IMAGE_SIZES}
            cdnWidth={GRID_IMAGE_WIDTH}
          />
        </div>
      </Link>
      <div className="mt-2.5 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={detailHref}
            onClick={() => saveHomeScrollIfHome()}
            onMouseEnter={prefetchDetail}
            onFocus={prefetchDetail}
            className="min-w-0 flex-1 break-words text-base font-semibold leading-snug text-neutral-900 line-clamp-2 hover:underline sm:text-[17px]"
          >
            {displayTitle}
          </Link>
          <FavoriteButton type="outfit" targetId={id} variant="inline" size="md" />
        </div>
        <ItemTypeBadges types={itemTypes} />
      </div>
    </article>
  );
}
