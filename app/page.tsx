import HomeContent from "@/components/HomeContent";
import { getOutfitList } from "@/lib/outfits-list";

export default async function HomePage() {
  const outfits = await getOutfitList(8, 0);
  return <HomeContent initialData={{ outfits }} />;
}
