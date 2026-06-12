"use client";

import { useAssetCacheBust } from "@/components/AssetCacheBustProvider";
import { assetUrl } from "@/lib/asset-url";

export function useAssetUrl(path: string | null | undefined): string {
  const bust = useAssetCacheBust();
  if (!path) return "";
  const url = assetUrl(path);
  if (!bust) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${bust}`;
}
