import { notFound } from "next/navigation";
import { Suspense } from "react";
import ItemDetailInfo from "@/components/ItemDetailInfo";
import ItemDetailOutfits from "@/components/ItemDetailOutfits";
import ItemDupesSection from "@/components/ItemDupesSection";
import { toDisplayItem } from "@/lib/catalog-item";
import { prisma } from "@/lib/db";
import { extractIdFromSlugParam } from "@/lib/slug";

function ItemInfoSkeleton() {
  return (
    <div className="mt-4 flex animate-pulse flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
      <div className="mx-auto h-[200px] w-full max-w-[200px] shrink-0 rounded-xl bg-neutral-200 sm:mx-0 sm:h-[180px] sm:w-[180px] sm:max-w-none" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="h-4 w-16 rounded bg-neutral-200" />
        <div className="h-6 w-3/4 max-w-sm rounded bg-neutral-200" />
        <div className="h-4 w-28 rounded bg-neutral-200" />
      </div>
    </div>
  );
}

function ItemOutfitsSkeleton() {
  return (
    <section className="mt-6 animate-pulse border-t border-border pt-5">
      <div className="h-5 w-24 rounded bg-neutral-200" />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-neutral-200" />
        ))}
      </div>
    </section>
  );
}

async function ItemInfoSection({ id }: { id: string }) {
  const item = await prisma.catalogItem.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  if (!item) notFound();

  return <ItemDetailInfo item={toDisplayItem(item)} />;
}

async function ItemOutfitsSection({ id }: { id: string }) {
  const placements = await prisma.outfitItem.findMany({
    where: { catalogItemId: id },
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
  });

  return (
    <ItemDetailOutfits
      outfits={placements.map((row) => ({
        id: row.outfit.id,
        mainImage: row.outfit.mainImage,
        eventName: row.outfit.eventName,
        date: row.outfit.date,
      }))}
    />
  );
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolvedId = extractIdFromSlugParam(id);

  return (
    <div className="min-w-0">
      <Suspense fallback={<ItemInfoSkeleton />}>
        <ItemInfoSection id={resolvedId} />
      </Suspense>
      <Suspense fallback={<ItemOutfitsSkeleton />}>
        <ItemOutfitsSection id={resolvedId} />
      </Suspense>
      <ItemDupesSection catalogItemId={resolvedId} />
    </div>
  );
}
