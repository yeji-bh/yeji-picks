"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClass = "max-w-md",
  closeDisabled = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
  closeDisabled?: boolean;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !closeDisabled) onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose, closeDisabled]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label={t("report.close")}
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (!closeDisabled) onClose();
        }}
      />
      <div
        className={`relative z-10 w-full ${maxWidthClass} overflow-hidden rounded-xl border border-border bg-card shadow-2xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0">
              {title ? (
                <h3
                  id="modal-title"
                  className="text-sm font-semibold text-foreground"
                >
                  {title}
                </h3>
              ) : null}
              {description ? (
                <p className="mt-0.5 text-xs text-muted">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={closeDisabled}
              className="shrink-0 text-lg leading-none text-neutral-400 hover:text-neutral-700 disabled:opacity-50"
              aria-label={t("report.close")}
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
