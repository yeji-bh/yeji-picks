import { notFound } from "next/navigation";
import OutfitDetailLoader from "@/components/OutfitDetailLoader";
import { getCurrentUser } from "@/lib/auth";
import { voterKeyForUser } from "@/lib/dupe-actor";
import { getOutfitDetail } from "@/lib/outfit-detail";
import { getOutfitReviewPage, REVIEW_PAGE_SIZE } from "@/lib/outfit-review";
import { extractIdFromSlugParam } from "@/lib/slug";

export default async function OutfitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolvedId = extractIdFromSlugParam(id);

  const [detail, user] = await Promise.all([
    getOutfitDetail(resolvedId),
    getCurrentUser(),
  ]);

  if (!detail) notFound();

  const initialReviews = user
    ? await getOutfitReviewPage(
        resolvedId,
        voterKeyForUser(user.id),
        user.role === "admin",
        0,
        REVIEW_PAGE_SIZE
      )
    : undefined;

  return (
    <OutfitDetailLoader
      outfitId={resolvedId}
      initialData={detail}
      initialReviews={initialReviews}
    />
  );
}
