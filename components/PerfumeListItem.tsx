"use client";

import { useAssetUrl } from "@/lib/use-asset-url";
import { GRID_IMAGE_QUALITY, LIST_THUMB_WIDTH } from "@/lib/grid-image";
import ProgressiveImage from "./ProgressiveImage";

type PerfumeListItemProps = {
  id: string;
  image: string;
  name: string;
  brand: string;
  description?: string | null;
  officialLink?: string | null;
  priority?: boolean;
  imageQuality?: number;
};

function ChevronIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-muted"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PerfumeListItem({
  image,
  name,
  brand,
  description,
  officialLink,
  priority = false,
  imageQuality = GRID_IMAGE_QUALITY,
}: PerfumeListItemProps) {
  const imageSrc = useAssetUrl(image);
  const link = (officialLink ?? "").trim();
  const desc = (description ?? "").trim();

  const row = (
    <div className="flex items-start gap-3 py-3.5">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-subtle lg:h-28 lg:w-28">
        <ProgressiveImage
          src={imageSrc}
          uploadPath={image}
          alt={`${brand} ${name}`}
          fill
          priority={priority}
          quality={imageQuality}
          className="object-contain"
          sizes="100px"
          cdnWidth={LIST_THUMB_WIDTH}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-semibold leading-snug text-foreground">
          {name}
        </p>
        <p className="truncate text-xs text-muted">{brand}</p>
        {desc ? (
          <p className="mt-1 break-words text-xs leading-relaxed text-muted">
            {desc}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-colors hover:bg-subtle/60"
      >
        {row}
      </a>
    );
  }

  return <article className="block">{row}</article>;
}
