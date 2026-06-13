import { cookies, headers } from "next/headers";
import HomeContent from "@/components/HomeContent";
import {
  LOCALE_MANUAL_COOKIE,
  resolveInitialLocale,
} from "@/lib/i18n/resolve-locale";
import { LOCALE_COOKIE } from "@/lib/i18n/settings";
import { HOME_PAGE_SIZE } from "@/lib/home-pagination";
import { DEFAULT_OUTFIT_SORT } from "@/lib/outfit-sort";
import { getOutfitList } from "@/lib/outfits-list";

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

  return <HomeContent initialData={{ outfits }} />;
}
