import { cookies, headers } from "next/headers";
import { preload } from "react-dom";
import HomeContent from "@/components/HomeContent";
import { assetUrl } from "@/lib/asset-url";
import {
  LOCALE_MANUAL_COOKIE,
  resolveInitialLocale,
} from "@/lib/i18n/resolve-locale";
import { LOCALE_COOKIE } from "@/lib/i18n/settings";
import { HOME_PAGE_SIZE } from "@/lib/home-pagination";
import { DEFAULT_OUTFIT_SORT } from "@/lib/outfit-sort";
import { getOutfitList } from "@/lib/outfits-list";

function preloadHomeLcpImage(mainImagePath: string) {
  const src = assetUrl(mainImagePath);
  if (!src || src.startsWith("/uploads/")) return;

  preload(src, {
    as: "image",
    fetchPriority: "high",
  });
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = resolveInitialLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    cookieStore.get(LOCALE_MANUAL_COOKIE)?.value,
    headerStore.get("accept-language")
  );

  const outfits = await getOutfitList(
    HOME_PAGE_SIZE,
    0,
    DEFAULT_OUTFIT_SORT,
    true,
    locale
  );

  const lcpImage = outfits.outfits[0]?.mainImage;
  if (lcpImage) preloadHomeLcpImage(lcpImage);

  return <HomeContent initialData={{ outfits }} />;
}
