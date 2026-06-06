import { notFound } from "next/navigation";
import ItemDetailContent from "@/components/ItemDetailContent";
import { toDisplayItem } from "@/lib/catalog-item";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.catalogItem.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      placements: {
        include: {
          outfit: {
            select: {
              id: true,
              mainImage: true,
              eventName: true,
              date: true,
            },
          },
        },
        orderBy: { outfit: { date: "desc" } },
      },
    },
  });

  if (!item) {
    notFound();
  }

  const display = toDisplayItem(item);

  return (
    <ItemDetailContent
      item={display}
      outfits={item.placements.map((row) => ({
        id: row.outfit.id,
        mainImage: row.outfit.mainImage,
        eventName: row.outfit.eventName,
        date: row.outfit.date,
      }))}
    />
  );
}
