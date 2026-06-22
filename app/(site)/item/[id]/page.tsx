import ItemDetailLoader from "@/components/ItemDetailLoader";
import { extractIdFromSlugParam } from "@/lib/slug";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolvedId = extractIdFromSlugParam(id);

  return <ItemDetailLoader itemId={resolvedId} />;
}
