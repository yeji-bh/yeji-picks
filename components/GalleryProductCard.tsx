"use client";

import { useAssetUrl } from "@/lib/use-asset-url";
import { GRID_IMAGE_QUALITY, GRID_IMAGE_SIZES, GRID_IMAGE_WIDTH } from "@/lib/grid-image";
import ProgressiveImage from "./ProgressiveImage";

type GalleryProductCardProps = {
  image: string;
  name: string;
  brand: string;
  officialLink?: string | null;
  priority?: boolean;
  imageQuality?: number;
};

export default function GalleryProductCard({
  image,
  name,
  brand,
  officialLink,
  priority = false,
  imageQuality = GRID_IMAGE_QUALITY,
}: GalleryProductCardProps) {
  const imageSrc = useAssetUrl(image);
  const link = (officialLink ?? "").trim();
  const title = name.trim() || brand.trim() || "—";
  const subtitle = name.trim() && brand.trim() ? brand.trim() : "";

  const imageBlock = (
    <div className="item-image-surface relative aspect-[3/4] w-full overflow-hidden">
      <ProgressiveImage
        src={imageSrc}
        uploadPath={image}
        alt={title}
        fill
        priority={priority}
        quality={imageQuality}
        className="object-contain"
        sizes={GRID_IMAGE_SIZES}
        cdnWidth={GRID_IMAGE_WIDTH}
      />
    </div>
  );

  const textBlock = (
    <div className="min-w-0 flex-1 space-y-0.5">
      {link ? (
        <>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="block break-words text-sm font-bold leading-snug text-foreground line-clamp-2 hover:underline"
          >
            {title}
          </a>
          {subtitle ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="block break-words text-base leading-snug text-foreground line-clamp-2 hover:underline sm:text-[17px]"
            >
              {subtitle}
            </a>
          ) : null}
        </>
      ) : (
        <>
          <p className="break-words text-sm font-bold leading-snug text-foreground line-clamp-2">
            {title}
          </p>
          {subtitle ? (
            <p className="break-words text-base leading-snug text-foreground line-clamp-2 sm:text-[17px]">
              {subtitle}
            </p>
          ) : null}
        </>
      )}
    </div>
  );

  return (
    <article className="group min-w-0">
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="block">
          {imageBlock}
        </a>
      ) : (
        imageBlock
      )}
      <div className="mt-2.5">{textBlock}</div>
    </article>
  );
}
