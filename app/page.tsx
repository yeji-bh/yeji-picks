import HomeContent from "@/components/HomeContent";
import { getItemList } from "@/lib/items-list";
import { getOutfitList } from "@/lib/outfits-list";

export default async function HomePage() {
  const [outfits, items] = await Promise.all([
    getOutfitList(8, 0),
    getItemList(8, 0),
  ]);
  return <HomeContent initialData={{ outfits, items }} />;
}
