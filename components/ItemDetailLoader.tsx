"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ItemDetailInfo from "./ItemDetailInfo";
import ItemDetailOutfits from "./ItemDetailOutfits";
import ItemDupesSection from "./ItemDupesSection";
import type { OutfitDisplayItem } from "@/lib/catalog-item";

type ItemDetailData = {
  item: OutfitDisplayItem;
  outfits: {
    id: string;
    mainImage: string;
    eventName: string;
    date: string;
  }[];
};

function ItemDetailSkeleton() {
  return (
    <div className="min-w-0 animate-pulse">
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div className="mx-auto h-[200px] w-full max-w-[200px] shrink-0 rounded-xl bg-neutral-200 sm:mx-0 sm:h-[180px] sm:w-[180px]" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-4 w-16 rounded bg-neutral-200" />
          <div className="h-6 w-3/4 max-w-sm rounded bg-neutral-200" />
          <div className="h-4 w-28 rounded bg-neutral-200" />
        </div>
      </div>
      <section className="mt-6 border-t border-border pt-5">
        <div className="h-5 w-24 rounded bg-neutral-200" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-neutral-200" />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function ItemDetailLoader({ itemId }: { itemId: string }) {
  const [data, setData] = useState<ItemDetailData | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch(`/api/catalog-items/${itemId}`);
      if (!res.ok) throw new Error("load failed");
      const json = await res.json();
      const { outfits, ...item } = json as OutfitDisplayItem & {
        outfits: ItemDetailData["outfits"];
        error?: string;
      };
      setData({
        item: {
          id: item.id,
          type: item.type,
          brand: item.brand,
          productName: item.productName,
          image: item.image,
          images: item.images ?? [],
          officialLink: item.officialLink,
          notes: item.notes,
          linkStatus: item.linkStatus,
          useCount: item.useCount,
        },
        outfits: (outfits ?? []).map((o) => ({
          id: o.id,
          mainImage: o.mainImage,
          eventName: o.eventName ?? "",
          date: o.date,
        })),
      });
    } catch {
      setData(null);
      setError(true);
    }
  }, [itemId]);

  useEffect(() => {
    setData(null);
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-lg font-semibold text-neutral-900">載入失敗</h1>
        <p className="mt-2 text-sm text-muted">單品頁面暫時無法顯示，請稍後再試。</p>
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

  if (!data) return <ItemDetailSkeleton />;

  return (
    <div className="min-w-0">
      <ItemDetailInfo item={data.item} />
      <ItemDetailOutfits outfits={data.outfits} />
      <ItemDupesSection catalogItemId={itemId} />
    </div>
  );
}
