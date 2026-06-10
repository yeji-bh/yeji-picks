import HomeContent from "@/components/HomeContent";
import { getOutfitList } from "@/lib/outfits-list";

export const revalidate = 3600;

export default async function HomePage() {
  const outfits = await getOutfitList(8, 0);
  return <HomeContent initialData={{ outfits }} />;
}
