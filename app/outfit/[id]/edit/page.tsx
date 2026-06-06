import { notFound, redirect } from "next/navigation";
import OutfitEditForm from "@/components/OutfitEditForm";
import OutfitEditPageHeader from "@/components/OutfitEditPageHeader";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function OutfitEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect(`/outfit/${id}`);
  }

  const outfit = await prisma.outfit.findUnique({ where: { id } });
  if (!outfit) {
    notFound();
  }

  return (
    <div className="min-w-0">
      <OutfitEditPageHeader outfitId={id} />
      <OutfitEditForm outfitId={id} />
    </div>
  );
}
