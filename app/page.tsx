import HomeContent from "@/components/HomeContent";
import { getOutfitList } from "@/lib/outfits-list";
import { safeDbQuery } from "@/lib/safe-db";

export const revalidate = 3600;

const EMPTY_OUTFIT_LIST = { outfits: [], total: 0, hasMore: false };

export default async function HomePage() {
  const outfits = await safeDbQuery(
    () => getOutfitList(8, 0),
    EMPTY_OUTFIT_LIST
  );
  return <HomeContent initialData={{ outfits }} />;
}
