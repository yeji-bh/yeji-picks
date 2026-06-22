"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ItemDetailInfo from "./ItemDetailInfo";
import ItemDetailOutfits from "./ItemDetailOutfits";
import ItemDupesSection from "./ItemDupesSection";
import type { DupeSummary } from "@/lib/catalog-dupe-types";
import type { ItemDetailData } from "@/lib/item-detail";

export default function ItemDetailLoader({
  itemId,
  initialData,
  initialDupes,
}: {
  itemId: string;
  initialData: ItemDetailData;
  initialDupes?: DupeSummary[];
}) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(false);

  useEffect(() => {
    setData(initialData);
    setError(false);
  }, [initialData, itemId]);

  const reload = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch(`/api/catalog-items/${itemId}`);
      if (!res.ok) throw new Error("load failed");
      const json = await res.json();
      const { outfits, ...item } = json as ItemDetailData["item"] & {
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
      setData(initialData);
      setError(true);
    }
  }, [initialData, itemId]);

  if (error) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-lg font-semibold text-neutral-900">載入失敗</h1>
        <p className="mt-2 text-sm text-muted">單品頁面暫時無法顯示，請稍後再試。</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => void reload()}
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

  return (
    <div className="min-w-0">
      <ItemDetailInfo item={data.item} onUpdated={reload} />
      <ItemDetailOutfits outfits={data.outfits} />
      <ItemDupesSection catalogItemId={itemId} initialDupes={initialDupes} />
    </div>
  );
}
