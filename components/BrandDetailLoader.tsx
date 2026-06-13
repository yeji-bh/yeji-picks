"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BrandDetailContent from "./BrandDetailContent";

type BrandItem = {
  id: string;
  type: string;
  brand: string | null;
  productName: string | null;
  image: string | null;
  useCount: number;
};

type BrandDetailData = {
  brand: string;
  items: BrandItem[];
};

function BrandDetailSkeleton() {
  return (
    <div className="min-w-0 animate-pulse">
      <div className="h-8 w-48 rounded bg-neutral-200 sm:h-9" />
      <div className="mt-2 h-4 w-28 rounded bg-neutral-200" />
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[3/4] rounded bg-neutral-200" />
            <div className="mt-2.5 h-4 w-16 rounded bg-neutral-200" />
            <div className="mt-1 h-5 w-3/4 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BrandDetailLoader({ slug }: { slug: string }) {
  const [data, setData] = useState<BrandDetailData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setNotFound(false);
    try {
      const res = await fetch(`/api/brands/${encodeURIComponent(slug)}`);
      if (res.status === 404) {
        setNotFound(true);
        setData(null);
        return;
      }
      if (!res.ok) throw new Error("load failed");
      setData((await res.json()) as BrandDetailData);
    } catch {
      setData(null);
      setError(true);
    }
  }, [slug]);

  useEffect(() => {
    setData(null);
    void load();
  }, [load]);

  if (notFound) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-lg font-semibold text-neutral-900">找不到品牌</h1>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          回首頁
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-lg font-semibold text-neutral-900">載入失敗</h1>
        <p className="mt-2 text-sm text-muted">品牌頁面暫時無法顯示，請稍後再試。</p>
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

  if (!data) return <BrandDetailSkeleton />;

  return <BrandDetailContent brand={data.brand} items={data.items} />;
}
