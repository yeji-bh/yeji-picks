import { notFound, redirect } from "next/navigation";
import CatalogItemEditForm from "@/components/CatalogItemEditForm";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CatalogItemEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (user?.role !== "admin") {
    redirect(`/item/${id}`);
  }

  const item = await prisma.catalogItem.findUnique({ where: { id } });
  if (!item) {
    notFound();
  }

  return <CatalogItemEditForm itemId={id} />;
}
