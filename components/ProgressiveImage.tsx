"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { assetUrlForAttempt } from "@/lib/asset-url";
import { gridImageSrc, markGridThumbMissing } from "@/lib/grid-image-url";
import { cdnImageProps } from "@/lib/remote-image";

type ProgressiveImageProps = ImageProps & {
  showSkeleton?: boolean;
  /** DB upload path for retry fallback (.webp ↔ .png). Omit for absolute URLs. */
  uploadPath?: string | null;
  /** Load the pre-generated `_t.webp` thumb first; falls back to full image on error. */
  cdnWidth?: number;
};

function srcKey(src: ImageProps["src"]): string {
  if (typeof src === "string") return src;
  if (src && typeof src === "object" && "src" in src) return String(src.src);
  return "";
}

const MAX_ATTEMPTS = 3;

function findImgNode(root: HTMLElement | null): HTMLImageElement | null {
  if (!root) return null;
  if (root instanceof HTMLImageElement) return root;
  return root.querySelector("img");
}

export default function ProgressiveImage({
  showSkeleton = true,
  className = "",
  priority = false,
  quality = 75,
  unoptimized,
  onLoad,
  onError,
  src,
  uploadPath,
  cdnWidth,
  ...props
}: ProgressiveImageProps) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const loadedSrcRef = useRef<string | null>(null);
  const cdn = cdnImageProps();
  const baseKey = srcKey(src);
  const maxAttempts = cdnWidth && uploadPath ? MAX_ATTEMPTS + 1 : MAX_ATTEMPTS;

  const resolvedSrc = useMemo(() => {
    if (!baseKey) return "";

    if (cdnWidth && uploadPath) {
      if (attempt === 0) return gridImageSrc(uploadPath, baseKey);
      if (attempt === 1) return baseKey;
      return assetUrlForAttempt(uploadPath, attempt - 1);
    }

    if (uploadPath && attempt > 0) {
      return assetUrlForAttempt(uploadPath, attempt);
    }
    if (attempt > 0) {
      const separator = baseKey.includes("?") ? "&" : "?";
      return `${baseKey}${separator}r=${attempt}`;
    }
    return baseKey;
  }, [baseKey, uploadPath, attempt, cdnWidth]);

  useEffect(() => {
    setAttempt(0);
    setLoaded(loadedSrcRef.current === baseKey);
  }, [baseKey]);

  useLayoutEffect(() => {
    if (!resolvedSrc || loaded) return;
    const img = findImgNode(rootRef.current);
    if (img?.complete && img.naturalWidth > 0) {
      loadedSrcRef.current = baseKey;
      setLoaded(true);
    }
  }, [resolvedSrc, loaded, baseKey]);

  if (!resolvedSrc) return null;

  const showOverlay = showSkeleton && !loaded && !priority;

  return (
    <span ref={rootRef} className="contents">
      {showOverlay ? (
        <span
          className="absolute inset-0 z-[1] bg-neutral-200 dark:bg-neutral-700"
          aria-hidden
        />
      ) : null}
      <Image
        {...props}
        src={resolvedSrc}
        priority={priority}
        fetchPriority={priority ? "high" : undefined}
        quality={quality}
        loading={priority ? "eager" : "lazy"}
        unoptimized={unoptimized ?? cdn.unoptimized}
        onLoad={(event) => {
          loadedSrcRef.current = baseKey;
          setLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          if (cdnWidth && uploadPath && attempt === 0) {
            markGridThumbMissing(uploadPath);
          }
          if (loadedSrcRef.current === baseKey) {
            onError?.(event);
            return;
          }
          if (attempt + 1 < maxAttempts) {
            setAttempt((value) => value + 1);
            return;
          }
          setLoaded(true);
          onError?.(event);
        }}
        className={className}
      />
    </span>
  );
}
