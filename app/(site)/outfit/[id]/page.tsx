import OutfitDetailLoader from "@/components/OutfitDetailLoader";
import { extractIdFromSlugParam } from "@/lib/slug";

export default async function OutfitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolvedId = extractIdFromSlugParam(id);

  return <OutfitDetailLoader outfitId={resolvedId} />;
}
