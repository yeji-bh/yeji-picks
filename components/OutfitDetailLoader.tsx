"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import OutfitDetailContent from "./OutfitDetailContent";
import OutfitDetailHeader from "./OutfitDetailHeader";
import { formatOutfitTitle } from "@/lib/outfit";

type OutfitDetailData = {
  id: string;
  eventName: string;
  date: string;
  mainImage: string;
  items: {
    id: string;
    type: string;
    brand: string | null;
    productName: string | null;
    image: string | null;
    officialLink: string | null;
    notes: string | null;
    linkStatus: string | null;
    useCount: number;
  }[];
  newer: { id: string; date: string; eventName: string } | null;
  older: { id: string; date: string; eventName: string } | null;
};

function OutfitDetailSkeleton() {
  return (
    <div className="min-w-0 animate-pulse">
      <div className="border-b border-border pb-3">
        <div className="h-6 w-40 rounded bg-neutral-200" />
      </div>
      <div className="mt-4 grid gap-8 lg:mt-6 lg:grid-cols-[clamp(260px,24.74vw,475px)_minmax(0,1fr)] lg:gap-x-12">
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
    </div>
  );
}

export default function OutfitDetailLoader({ outfitId }: { outfitId: string }) {
  const [data, setData] = useState<OutfitDetailData | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch(`/api/outfits/${outfitId}`);
      if (!res.ok) throw new Error("load failed");
      const json = (await res.json()) as OutfitDetailData & { error?: string };
      setData({
        ...json,
        items: (json.items ?? []).map((item) => ({
          id: item.id,
          type: item.type,
          brand: item.brand || null,
          productName: item.productName || null,
          image: item.image || null,
          officialLink: item.officialLink || null,
          notes: item.notes || null,
          linkStatus: item.linkStatus ?? null,
          useCount: item.useCount ?? 0,
        })),
      });
    } catch {
      setData(null);
      setError(true);
    }
  }, [outfitId]);

  useEffect(() => {
    setData(null);
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-lg font-semibold text-neutral-900">載入失敗</h1>
        <p className="mt-2 text-sm text-muted">穿搭頁面暫時無法顯示，請稍後再試。</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className="cursor-pointer rounded-lg border border-border bg-white px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            重試
          </button>
          <Link
            href="/"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            回首頁
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return <OutfitDetailSkeleton />;

  const title = formatOutfitTitle(data.date, data.eventName);

  return (
    <div className="min-w-0">
      <OutfitDetailHeader outfitId={data.id} outfitTitle={title} />
      <OutfitDetailContent
        outfitId={data.id}
        outfitTitle={title}
        mainImage={data.mainImage}
        imageAlt={title}
        items={data.items}
        newer={data.newer}
        older={data.older}
      />
    </div>
  );
}
