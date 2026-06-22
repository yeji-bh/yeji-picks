"use client";

import { useMemo, useState } from "react";
import { assetUrlForAttempt } from "@/lib/asset-url";
import { gridImageSrc, markGridThumbMissing } from "@/lib/grid-image-url";
import { useAssetUrl } from "@/lib/use-asset-url";
import FavoriteButton from "./FavoriteButton";
import ImageLightbox from "./ImageLightbox";

type NailArtCardProps = {
  id: string;
  image: string;
  priority?: boolean;
};

export default function NailArtCard({
  id,
  image,
  priority = false,
}: NailArtCardProps) {
  const imageSrc = useAssetUrl(image);
  const [attempt, setAttempt] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const src = useMemo(() => {
    if (attempt === 0) return gridImageSrc(image, imageSrc);
    if (attempt === 1) return imageSrc;
    return assetUrlForAttempt(image, attempt - 1);
  }, [attempt, image, imageSrc]);

  return (
    <>
      <article className="group relative min-w-0 break-inside-avoid">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="block w-full cursor-zoom-in overflow-hidden rounded-sm border border-border bg-item-image"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="block h-auto w-full"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onError={() => {
              if (attempt === 0) markGridThumbMissing(image);
              if (attempt + 1 < 4) setAttempt((value) => value + 1);
            }}
          />
        </button>
        <div className="absolute right-2 top-2 z-10">
          <FavoriteButton type="nailArt" targetId={id} overlayTone="light" />
        </div>
      </article>
      <ImageLightbox
        src={imageSrc}
        alt=""
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
