export type DupeVoteType = "like" | "dislike";

export type DupeSummary = {
  id: string;
  image: string;
  brand: string;
  productName: string | null;
  priceRange: string | null;
  buyLink: string;
  notes: string | null;
  createdAt: string;
  likes: number;
  dislikes: number;
  score: number;
  userVote: DupeVoteType | null;
};
