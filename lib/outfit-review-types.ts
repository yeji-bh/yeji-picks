export type OutfitReviewSummary = {
  id: string;
  authorName: string | null;
  isAnonymous: boolean;
  content: string;
  createdAt: string;
  updatedAt: string;
  isMine: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type OutfitReviewPage = {
  reviews: OutfitReviewSummary[];
  total: number;
  hasMore: boolean;
  mine: OutfitReviewSummary | null;
};
