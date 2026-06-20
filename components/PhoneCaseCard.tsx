"use client";

import { useAssetUrl } from "@/lib/use-asset-url";
import { GRID_IMAGE_QUALITY, GRID_IMAGE_SIZES } from "@/lib/grid-image";
import FavoriteButton from "./FavoriteButton";
import ProgressiveImage from "./ProgressiveImage";

type PhoneCaseCardProps = {
  id: string;
  image: string;
  brand: string;
  model: string;
  officialLink?: string | null;
  priority?: boolean;
  imageQuality?: number;
};

export default function PhoneCaseCard({
  id,
  image,
  brand,
  model,
  officialLink,
  priority = false,
  imageQuality = GRID_IMAGE_QUALITY,
}: PhoneCaseCardProps) {
  const imageSrc = useAssetUrl(image);
  const link = (officialLink ?? "").trim();

  const imageBlock = (
    <div className="item-image-surface relative aspect-[3/4] w-full overflow-hidden">
      <ProgressiveImage
        src={imageSrc}
        uploadPath={image}
        alt={`${brand} ${model}`}
        fill
        priority={priority}
        quality={imageQuality}
        className="object-contain"
        sizes={GRID_IMAGE_SIZES}
      />
    </div>
  );

  return (
    <article className="group min-w-0">
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {imageBlock}
        </a>
      ) : (
        imageBlock
      )}
      <div className="mt-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-0.5">
            {link ? (
              <>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block break-words text-sm font-bold leading-snug text-foreground line-clamp-2 hover:underline"
                >
                  {brand}
                </a>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block break-words text-base leading-snug text-foreground line-clamp-2 hover:underline sm:text-[17px]"
                >
                  {model}
                </a>
              </>
            ) : (
              <>
                <p className="break-words text-sm font-bold leading-snug text-foreground line-clamp-2">
                  {brand}
                </p>
                <p className="break-words text-base leading-snug text-foreground line-clamp-2 sm:text-[17px]">
                  {model}
                </p>
              </>
            )}
          </div>
          <FavoriteButton type="phoneCase" targetId={id} variant="inline" size="md" />
        </div>
      </div>
    </article>
  );
}
