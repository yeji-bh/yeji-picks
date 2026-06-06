"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ReportTarget from "./ReportTarget";

export default function ItemReport({
  outfitId,
  itemId,
  outfitTitle,
  itemType,
  itemBrand,
  itemProductName,
}: {
  outfitId: string;
  itemId: string;
  outfitTitle: string;
  itemType: string;
  itemBrand: string | null;
  itemProductName: string | null;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function handleClose() {
    if (loading) return;
    setOpen(false);
    setError(null);
    setDone(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outfitId, itemId, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("report.fail"));

      setDone(true);
      setMessage("");
      setTimeout(() => {
        setOpen(false);
        setDone(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("report.fail"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer text-xs text-muted underline hover:text-neutral-900"
      >
        {t("report.itemButton")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  {t("report.itemModalTitle")}
                </h3>
                <p className="mt-0.5 text-xs text-muted">{t("report.itemDesc")}</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="shrink-0 text-lg leading-none text-neutral-400 hover:text-neutral-700"
                aria-label={t("report.close")}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 px-4 py-4">
              <ReportTarget
                kind="item"
                outfitTitle={outfitTitle}
                itemType={itemType}
                itemBrand={itemBrand}
                itemProductName={itemProductName}
              />
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder={t("report.placeholder")}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              {done && (
                <p className="text-xs text-green-600">{t("report.success")}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-neutral-700 disabled:opacity-50"
                >
                  {t("report.close")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loading ? t("report.sending") : t("report.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
