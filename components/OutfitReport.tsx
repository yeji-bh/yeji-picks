"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import ReportTarget from "./ReportTarget";

const reportBtnClass =
  "shrink-0 cursor-pointer rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900";

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

export default function OutfitReport({
  outfitId,
  outfitTitle,
}: {
  outfitId: string;
  outfitTitle: string;
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
        body: JSON.stringify({ outfitId, message }),
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
        aria-label={t("report.button")}
        className={reportBtnClass}
      >
        <ReportIcon />
      </button>

      <Modal
        open={open}
        onClose={handleClose}
        title={t("report.modalTitle")}
        description={t("report.desc")}
        closeDisabled={loading}
      >
        <form onSubmit={handleSubmit} className="space-y-3 px-4 py-4">
          <ReportTarget kind="outfit" outfitTitle={outfitTitle} />
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
      </Modal>
    </>
  );
}
