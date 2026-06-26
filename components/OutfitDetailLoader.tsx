"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import OutfitDetailContent from "./OutfitDetailContent";
import OutfitDetailHeader from "./OutfitDetailHeader";
import OutfitDetailSkeleton from "./OutfitDetailSkeleton";
import { formatOutfitTitle } from "@/lib/outfit";
import type { OutfitDetailData } from "@/lib/outfit-detail";
import {
  getOutfitDetailCache,
  prefetchOutfitDetail,
  setOutfitDetailCache,
} from "@/lib/outfit-detail-cache";

export default function OutfitDetailLoader({ outfitId }: { outfitId: string }) {
  const cached = getOutfitDetailCache(outfitId);
  const [data, setData] = useState<OutfitDetailData | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const hit = getOutfitDetailCache(outfitId);
    if (hit) {
      setData(hit);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    const result = await prefetchOutfitDetail(outfitId);
    if (result) {
      setData(result);
      setLoading(false);
      return;
    }

    setData(null);
    setLoading(false);
    setError(true);
  }, [outfitId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data) return;
    setOutfitDetailCache(data.id, data);
    if (data.newer) void prefetchOutfitDetail(data.newer.id);
    if (data.older) void prefetchOutfitDetail(data.older.id);
  }, [data]);

  if (loading) {
    return <OutfitDetailSkeleton />;
  }

  if (error || !data) {
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
