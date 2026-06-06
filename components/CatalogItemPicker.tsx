"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { assetUrl } from "@/lib/asset-url";

export type CatalogPick = {
  id: string;
  type: string;
  brand: string | null;
  productName: string | null;
  image: string | null;
  officialLink: string | null;
  notes: string | null;
  useCount: number;
};

export default function CatalogItemPicker({
  onSelect,
  onClear,
  selected,
}: {
  onSelect: (item: CatalogPick) => void;
  onClear: () => void;
  selected: CatalogPick | null;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogPick[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/catalog-items/search?q=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json();
        if (res.ok) setResults(data.items ?? []);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (selected) {
    return (
      <div className="rounded-lg border border-border bg-neutral-50 p-3">
        <div className="flex items-start gap-3">
          {selected.image && (
            <img
              src={assetUrl(selected.image)}
              alt=""
              className="h-14 w-14 rounded-md border border-border bg-white object-contain"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-neutral-900">
              {selected.productName || selected.brand || t("item.unnamed")}
            </p>
            {selected.brand && selected.productName && (
              <p className="text-xs text-muted">{selected.brand}</p>
            )}
            <p className="mt-1 text-[11px] text-muted">
              {t("item.useCount", { count: selected.useCount })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted underline hover:text-neutral-900"
          >
            {t("item.unlink")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("item.searchPlaceholder")}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-neutral-400"
      />
      {loading && <p className="text-xs text-muted">{t("loading")}</p>}
      {results.length > 0 && (
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border bg-white p-1">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(item);
                  setQuery("");
                  setResults([]);
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-neutral-50"
              >
                {item.image && (
                  <img
                    src={assetUrl(item.image)}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded border border-border bg-white object-contain"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-neutral-900">
                    {item.productName || item.brand || "—"}
                  </span>
                  <span className="block truncate text-[11px] text-muted">
                    {item.brand}
                    {item.useCount > 0 &&
                      ` · ${t("item.useCount", { count: item.useCount })}`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
