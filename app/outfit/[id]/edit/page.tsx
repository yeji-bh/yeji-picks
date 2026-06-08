import { notFound, redirect } from "next/navigation";
import OutfitEditForm from "@/components/OutfitEditForm";
import OutfitEditPageHeader from "@/components/OutfitEditPageHeader";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { outfitHref } from "@/lib/entity-href";
import { extractIdFromSlugParam } from "@/lib/slug";

export default async function OutfitEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolvedId = extractIdFromSlugParam(id);
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect(outfitHref({ id: resolvedId }));
  }

  const outfit = await prisma.outfit.findUnique({ where: { id: resolvedId } });
  if (!outfit) {
    notFound();
  }

  return (
    <div className="min-w-0">
      <OutfitEditPageHeader outfitId={resolvedId} />
      <OutfitEditForm outfitId={resolvedId} />
    </div>
  );
}
