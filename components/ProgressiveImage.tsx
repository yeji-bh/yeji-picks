"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cdnImageProps } from "@/lib/remote-image";

type ProgressiveImageProps = ImageProps & {
  showSkeleton?: boolean;
};

export default function ProgressiveImage({
  showSkeleton = true,
  className = "",
  priority = false,
  unoptimized,
  onLoad,
  ...props
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const cdn = cdnImageProps();

  return (
    <>
      {showSkeleton && !loaded ? (
        <div
          className="absolute inset-0 animate-pulse bg-neutral-200"
          aria-hidden
        />
      ) : null}
      <Image
        {...props}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        unoptimized={unoptimized ?? cdn.unoptimized}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        className={`${className} transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}
