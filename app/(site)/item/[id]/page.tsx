import { notFound } from "next/navigation";
import ItemDetailLoader from "@/components/ItemDetailLoader";
import { getCurrentUser } from "@/lib/auth";
import { listCatalogDupes } from "@/lib/catalog-dupe";
import { voterKeyForUser } from "@/lib/dupe-actor";
import { getItemDetail } from "@/lib/item-detail";
import { extractIdFromSlugParam } from "@/lib/slug";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolvedId = extractIdFromSlugParam(id);

  const [detail, user] = await Promise.all([
    getItemDetail(resolvedId),
    getCurrentUser(),
  ]);

  if (!detail) notFound();

  const initialDupes = user
    ? await listCatalogDupes(resolvedId, voterKeyForUser(user.id))
    : undefined;

  return (
    <ItemDetailLoader
      itemId={resolvedId}
      initialData={detail}
      initialDupes={initialDupes}
    />
  );
}
