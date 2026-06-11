import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// SSG-only cache: build-time pages are served from Workers Static Assets.
// Do NOT use time-based revalidate (export const revalidate) without also
// configuring R2 incremental cache + DO queue — that causes Worker 1101 crashes.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
