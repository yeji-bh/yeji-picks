import { notFound, redirect } from "next/navigation";
import CatalogItemEditForm from "@/components/CatalogItemEditForm";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { itemHref } from "@/lib/entity-href";
import { extractIdFromSlugParam } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function CatalogItemEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolvedId = extractIdFromSlugParam(id);
  const user = await getCurrentUser();

  if (user?.role !== "admin") {
    redirect(itemHref({ id: resolvedId }));
  }

  const item = await prisma.catalogItem.findUnique({ where: { id: resolvedId } });
  if (!item) {
    notFound();
  }

  return <CatalogItemEditForm itemId={resolvedId} />;
}
