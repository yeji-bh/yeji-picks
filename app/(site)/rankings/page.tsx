import type { Metadata } from "next";
import RankingsContent from "@/components/RankingsContent";
import { getRankingsData } from "@/lib/rankings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rankings",
};

export default async function RankingsPage() {
  const { topBrands, topItems } = await getRankingsData(10);

  return <RankingsContent topBrands={topBrands} topItems={topItems} />;
}
