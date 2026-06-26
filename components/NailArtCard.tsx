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
  const trimmedImage = image?.trim() ?? "";
  const imageSrc = useAssetUrl(trimmedImage);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(!trimmedImage);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const src = useMemo(() => {
    if (!trimmedImage) return "";
    if (attempt === 0) return gridImageSrc(trimmedImage, imageSrc);
    if (attempt === 1) return imageSrc;
    return assetUrlForAttempt(trimmedImage, attempt - 1);
  }, [attempt, trimmedImage, imageSrc]);

  if (failed || !trimmedImage) {
    return null;
  }

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
              if (attempt === 0) markGridThumbMissing(trimmedImage);
              if (attempt + 1 < 4) {
                setAttempt((value) => value + 1);
              } else {
                setFailed(true);
              }
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
