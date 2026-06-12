"use client";

import { useMemo } from "react";
import { assetUrl } from "@/lib/asset-url";

/** Stable CDN URL for a managed upload path (no cache-bust query params). */
export function useAssetUrl(path: string | null | undefined): string {
  return useMemo(() => (path ? assetUrl(path) : ""), [path]);
}
