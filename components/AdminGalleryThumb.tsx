"use client";

import { useAssetUrl } from "@/lib/use-asset-url";
import ProgressiveImage from "./ProgressiveImage";

export default function AdminGalleryThumb({
  image,
  alt,
}: {
  image: string;
  alt: string;
}) {
  const src = useAssetUrl(image);
  return (
    <ProgressiveImage
      src={src}
      uploadPath={image}
      alt={alt}
      fill
      className="object-cover"
      sizes="120px"
    />
  );
}
