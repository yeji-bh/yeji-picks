declare global {
  interface Window {
    __ASSET_BASE__?: string;
  }
}

/** R2 / CDN base URL (Workers runtime or build-time). */
export function getAssetBaseUrl(): string {
  if (typeof window !== "undefined" && window.__ASSET_BASE__) {
    return window.__ASSET_BASE__.replace(/\/$/, "");
  }
  const base =
    process.env.ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
    "";
  return base.replace(/\/$/, "");
}

export function hasAssetBaseUrl(): boolean {
  return !!getAssetBaseUrl();
}
