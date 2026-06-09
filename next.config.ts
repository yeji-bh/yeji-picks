import type { NextConfig } from "next";

function assetRemotePatterns(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL;
  if (!base) return [];
  try {
    const url = new URL(base);
    const protocol = url.protocol.replace(":", "") as "http" | "https";
    return [{ protocol, hostname: url.hostname, pathname: "/**" }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@libsql/isomorphic-ws",
    "@libsql/client",
    "@prisma/client",
    ".prisma/client",
    "@prisma/adapter-libsql",
    "libsql",
  ],
  allowedDevOrigins: ["192.168.100.187"],
  images: {
    remotePatterns: assetRemotePatterns(),
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
