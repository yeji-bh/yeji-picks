"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import ReportTarget from "./ReportTarget";

const reportBtnClass =
  "shrink-0 cursor-pointer rounded-full p-2 text-muted transition-colors hover:bg-subtle hover:text-foreground";

function ReportIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="4" y1="22" x2="4" y2="15" strokeLinecap="round" />
    </svg>
  );
}

export default function ItemReport({
  outfitId,
  itemId,
  outfitTitle,
  itemType,
  itemBrand,
  itemProductName,
  variant = "text",
  compact = false,
}: {
  outfitId: string;
  itemId: string;
  outfitTitle: string;
  itemType: string;
  itemBrand: string | null;
  itemProductName: string | null;
  variant?: "text" | "icon";
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        aria-label={t("report.itemButton")}
        className={
          variant === "icon"
            ? `${reportBtnClass} ${compact ? "p-1.5" : ""}`
            : "cursor-pointer text-xs text-muted underline hover:text-neutral-900"
        }
      >
        {variant === "icon" ? (
          <ReportIcon className={compact ? "h-[18px] w-[18px]" : "h-5 w-5"} />
        ) : (
          t("report.itemButton")
        )}
      </button>

      <Modal
        open={open}
        onClose={handleClose}
        title={t("report.itemModalTitle")}
        description={t("report.itemDesc")}
        closeDisabled={loading}
      >
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
            className="ui-field w-full px-3 py-2 text-sm"
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
              className="ui-btn-secondary flex-1 px-4 py-2.5 text-sm"
            >
              {t("report.close")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-fg disabled:opacity-50"
            >
              {loading ? t("report.sending") : t("report.submit")}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
