"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ItemDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[item detail]", error);
  }, [error]);

  return (
    <div className="py-16 text-center">
      <h1 className="text-lg font-semibold text-neutral-900">載入失敗</h1>
      <p className="mt-2 text-sm text-muted">單品頁面暫時無法顯示，請稍後再試。</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
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
