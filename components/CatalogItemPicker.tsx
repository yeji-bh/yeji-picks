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
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const res = await fetch(
            `/api/catalog-items/search?q=${encodeURIComponent(trimmed)}`,
            { signal: controller.signal }
          );
          if (!res.ok) {
            if (!controller.signal.aborted) setResults([]);
            return;
          }
          const data = await res.json();
          if (!controller.signal.aborted) {
            setResults(data.items ?? []);
          }
        } catch {
          if (!controller.signal.aborted) setResults([]);
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      })();
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  if (selected) {
    return (
      <div className="rounded-lg border border-border bg-subtle p-3">
        <div className="flex items-start gap-3">
          {selected.image && (
            <img
              src={assetUrl(selected.image)}
              alt=""
              className="h-14 w-14 rounded-md border border-border bg-white object-contain"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {selected.productName || selected.brand || t("item.unnamed")}
            </p>
            {selected.brand && selected.productName && (
              <p className="text-xs text-muted">{selected.brand}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted underline hover:text-foreground"
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
        className="ui-field w-full px-3 py-2 text-sm"
      />
      {loading && <p className="text-xs text-muted">{t("loading")}</p>}
      {results.length > 0 && (
        <ul className="ui-dropdown max-h-48 space-y-1 overflow-y-auto p-1">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(item);
                  setQuery("");
                  setResults([]);
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-subtle"
              >
                {item.image && (
                  <img
                    src={assetUrl(item.image)}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded border border-border bg-white object-contain"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">
                    {item.productName || item.brand || "—"}
                  </span>
                  {item.brand && (
                    <span className="block truncate text-sm text-muted">
                      {item.brand}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
