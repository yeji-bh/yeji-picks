"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { syncMainBounds } from "@/lib/main-bounds";

export default function ImageLightbox({
  src,
  alt,
  open,
  onClose,
}: {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;

    syncMainBounds();
    const onResize = () => syncMainBounds();
    window.addEventListener("resize", onResize);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const mainBoundsStyle = {
    top: "var(--header-h, 57px)",
    bottom: "var(--footer-h, 53px)",
  };

  return (
    <div
      className="fixed inset-x-0 z-50 cursor-pointer bg-black/75"
      style={mainBoundsStyle}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-lg leading-none text-neutral-600 shadow-md hover:bg-neutral-50 hover:text-neutral-900"
        aria-label={t("outfit.closeZoom")}
      >
        ×
      </button>
      <div
        className="flex h-full w-full cursor-default items-center justify-center p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={src} alt={alt} className="lightbox-img" />
      </div>
    </div>
  );
}
