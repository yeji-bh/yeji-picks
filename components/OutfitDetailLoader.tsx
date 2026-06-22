"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import OutfitDetailContent from "./OutfitDetailContent";
import OutfitDetailHeader from "./OutfitDetailHeader";
import { formatOutfitTitle } from "@/lib/outfit";
import type { OutfitDetailData } from "@/lib/outfit-detail";
import type { OutfitReviewPage } from "@/lib/outfit-review-types";

export default function OutfitDetailLoader({
  outfitId,
  initialData,
  initialReviews,
}: {
  outfitId: string;
  initialData: OutfitDetailData;
  initialReviews?: OutfitReviewPage;
}) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(false);

  useEffect(() => {
    setData(initialData);
    setError(false);
  }, [initialData, outfitId]);

  const retry = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch(`/api/outfits/${outfitId}`);
      if (!res.ok) throw new Error("load failed");
      const json = (await res.json()) as OutfitDetailData & { error?: string };
      setData(json);
    } catch {
      setData(initialData);
      setError(true);
    }
  }, [initialData, outfitId]);

  if (error) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-lg font-semibold text-neutral-900">載入失敗</h1>
        <p className="mt-2 text-sm text-muted">穿搭頁面暫時無法顯示，請稍後再試。</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => void retry()}
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
        initialReviews={initialReviews}
      />
    </div>
  );
}
