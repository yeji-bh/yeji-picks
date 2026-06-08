import { notFound } from "next/navigation";
import { Suspense } from "react";
import OutfitDetailContent from "@/components/OutfitDetailContent";
import OutfitDetailHeader from "@/components/OutfitDetailHeader";
import { getOutfitDisplayItems } from "@/lib/catalog-item";
import { prisma } from "@/lib/db";
import { extractIdFromSlugParam } from "@/lib/slug";
import { getOutfitNeighbors } from "@/lib/outfit-nav";
import { formatOutfitTitle } from "@/lib/outfit";

function OutfitHeaderSkeleton() {
  return (
    <div className="animate-pulse border-b border-border pb-3">
      <div className="h-6 w-40 rounded bg-neutral-200" />
    </div>
  );
}

function OutfitBodySkeleton() {
  return (
    <div className="mt-4 animate-pulse grid gap-8 lg:mt-6 lg:grid-cols-[clamp(260px,24.74vw,475px)_minmax(0,1fr)] lg:gap-x-12">
      <div className="aspect-[3/4] w-full rounded-xl bg-neutral-200 lg:max-w-[475px]" />
      <div className="space-y-4">
        <div className="h-5 w-12 rounded bg-neutral-200" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-24 w-24 shrink-0 rounded-lg bg-neutral-200" />
            <div className="flex-1 space-y-2 py-2">
              <div className="h-3 w-16 rounded bg-neutral-200" />
              <div className="h-4 w-32 rounded bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function OutfitHeaderSection({ id }: { id: string }) {
  const outfit = await prisma.outfit.findUnique({ where: { id } });
  if (!outfit) notFound();

  const title = formatOutfitTitle(outfit.date, outfit.eventName);
  return <OutfitDetailHeader outfitId={outfit.id} outfitTitle={title} />;
}

async function OutfitBodySection({ id }: { id: string }) {
  const [outfit, neighbors, items] = await Promise.all([
    prisma.outfit.findUnique({ where: { id } }),
    getOutfitNeighbors(id),
    getOutfitDisplayItems(id),
  ]);

  if (!outfit) notFound();

  const title = formatOutfitTitle(outfit.date, outfit.eventName);

  return (
    <OutfitDetailContent
      outfitId={outfit.id}
      outfitTitle={title}
      mainImage={outfit.mainImage}
      imageAlt={title}
      items={items}
      newer={neighbors.newer}
      older={neighbors.older}
    />
  );
}

export default async function OutfitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolvedId = extractIdFromSlugParam(id);

  return (
    <div className="min-w-0">
      <Suspense fallback={<OutfitHeaderSkeleton />}>
        <OutfitHeaderSection id={resolvedId} />
      </Suspense>
      <Suspense fallback={<OutfitBodySkeleton />}>
        <OutfitBodySection id={resolvedId} />
      </Suspense>
    </div>
  );
}
