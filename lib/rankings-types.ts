export type BrandRankingEntry = {
  brand: string;
  brandKey: string;
  itemCount: number;
  useCount: number;
};

export type ItemRankingEntry = {
  id: string;
  type: string;
  brand: string | null;
  productName: string | null;
  image: string | null;
  useCount: number;
};

export type RankingsData = {
  topBrands: BrandRankingEntry[];
  topItems: ItemRankingEntry[];
};
