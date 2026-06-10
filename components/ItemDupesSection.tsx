"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider";
import FileInputZone from "./FileInputZone";
import { useToast } from "./ToastProvider";
import { assetUrl } from "@/lib/asset-url";
import { brandHref } from "@/lib/brand";
import { prepareImageFile } from "@/lib/prepare-image-file";
import type { DupeSummary, DupeVoteType } from "@/lib/catalog-dupe-types";
import { dupeGuestHeaders } from "@/lib/dupe-guest-id";

function ExternalLinkIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
    </svg>
  );
}

export default function ItemDupesSection({
  catalogItemId,
}: {
  catalogItemId: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { showToast } = useToast();
  const [dupes, setDupes] = useState<DupeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [productName, setProductName] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [buyLink, setBuyLink] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const loadDupes = useCallback(async () => {
    try {
      const res = await fetch(`/api/catalog-items/${catalogItemId}/dupes`, {
        headers: dupeGuestHeaders(),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { dupes?: DupeSummary[] };
      setDupes(data.dupes ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [catalogItemId]);

  useEffect(() => {
    loadDupes();
  }, [loadDupes]);

  useEffect(() => {
    if (!formOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) {
        resetForm();
        setFormOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [formOpen, submitting]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function closeForm() {
    if (submitting) return;
    resetForm();
    setFormOpen(false);
  }

  async function handleImageSelect(file: File | null) {
    if (!file) return;
    try {
      const { file: prepared, previewUrl } = await prepareImageFile(file);
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(prepared);
      setImagePreview(previewUrl);
    } catch {
      showToast(t("feedback.imageUnsupported"), "error");
    }
  }

  function resetForm() {
    setBrand("");
    setProductName("");
    setPriceRange("");
    setBuyLink("");
    setNotes("");
    setImageFile(null);
    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageFile) {
      showToast(t("dupe.imageRequired"), "error");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("brand", brand);
      formData.append("buyLink", buyLink);
      if (productName) formData.append("productName", productName);
      if (priceRange) formData.append("priceRange", priceRange);
      if (notes) formData.append("notes", notes);
      formData.append("image", imageFile);

      const res = await fetch(`/api/catalog-items/${catalogItemId}/dupes`, {
        method: "POST",
        headers: dupeGuestHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("dupe.submitFail"));

      setDupes(data.dupes ?? []);
      closeForm();
      showToast(t("dupe.submitSuccess"));
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("dupe.submitFail"),
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(dupeId: string, vote: DupeVoteType) {
    try {
      const res = await fetch(`/api/dupes/${dupeId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...dupeGuestHeaders(),
        },
        body: JSON.stringify({ vote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("dupe.voteFail"));
      setDupes(data.dupes ?? []);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("dupe.voteFail"),
        "error"
      );
    }
  }

  async function handleDelete(dupeId: string) {
    if (!confirm(t("dupe.deleteConfirm"))) return;

    setDeletingId(dupeId);
    try {
      const res = await fetch(`/api/dupes/${dupeId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("dupe.deleteFail"));
      setDupes(data.dupes ?? []);
      showToast(t("dupe.deleteSuccess"));
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("dupe.deleteFail"),
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mt-8 border-t border-border/60 pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div>
          <h2 className="text-sm font-medium text-muted">
            {t("dupe.sectionTitle")}
          </h2>
          <p className="mt-0.5 text-[11px] text-muted/80">{t("dupe.sectionDesc")}</p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="cursor-pointer text-xs text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
        >
          {t("dupe.addDupe")}
        </button>
      </div>

      {formOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          onClick={closeForm}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  {t("dupe.addDupe")}
                </h3>
                <p className="mt-0.5 text-xs text-muted">{t("dupe.sectionDesc")}</p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                disabled={submitting}
                className="shrink-0 text-lg leading-none text-neutral-400 hover:text-neutral-700"
                aria-label={t("dupe.cancelAdd")}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 px-4 py-4">
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder={`${t("dupe.brand")} *`}
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={t("dupe.productName")}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <input
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                placeholder={t("dupe.priceRange")}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <input
                type="url"
                value={buyLink}
                onChange={(e) => setBuyLink(e.target.value)}
                placeholder={`${t("dupe.buyLink")} *`}
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={t("dupe.notes")}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <FileInputZone onChange={handleImageSelect} disabled={submitting} />
              {imagePreview ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-border bg-white">
                  <img
                    src={imagePreview}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-neutral-700 disabled:opacity-50"
                >
                  {t("dupe.cancelAdd")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {submitting ? t("submit.submitting") : t("dupe.submitBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-3 text-xs text-muted">{t("loading")}</p>
      ) : dupes.length === 0 ? (
        <p className="mt-3 text-xs text-muted">{t("dupe.empty")}</p>
      ) : (
        <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(128px,148px))] justify-start gap-3">
          {dupes.map((dupe) => (
            <li
              key={dupe.id}
              className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-white"
            >
              <div className="relative aspect-[4/5] w-full bg-neutral-50">
                <Image
                  src={assetUrl(dupe.image)}
                  alt={dupe.productName ?? dupe.brand}
                  fill
                  className="object-contain p-1.5"
                  sizes="148px"
                />
                <a
                  href={dupe.buyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("outfit.openLink")}
                  className="absolute left-1 top-1 rounded-full bg-white/85 p-1 text-neutral-500 hover:bg-white hover:text-neutral-900"
                >
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(dupe.id)}
                    disabled={deletingId === dupe.id}
                    className="absolute right-1 top-1 cursor-pointer rounded bg-white/85 px-1 py-px text-[10px] text-red-600 hover:bg-white disabled:opacity-50"
                  >
                    {deletingId === dupe.id ? "…" : t("dupe.delete")}
                  </button>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col p-2">
                <Link
                  href={brandHref(dupe.brand)}
                  className="truncate text-xs font-medium text-neutral-800 hover:underline"
                >
                  {dupe.brand}
                </Link>
                {dupe.productName ? (
                  <p className="mt-0.5 line-clamp-2 break-words text-[11px] text-neutral-600">
                    {dupe.productName}
                  </p>
                ) : null}
                {dupe.priceRange ? (
                  <p className="mt-0.5 text-[11px] text-muted">{dupe.priceRange}</p>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center gap-1 pt-2">
                  <button
                    type="button"
                    onClick={() => handleVote(dupe.id, "like")}
                    className={`inline-flex cursor-pointer items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] ${
                      dupe.userVote === "like"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-border/70 text-neutral-500 hover:bg-neutral-50"
                    }`}
                  >
                    <span aria-hidden>👍</span>
                    {dupe.likes}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote(dupe.id, "dislike")}
                    className={`inline-flex cursor-pointer items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] ${
                      dupe.userVote === "dislike"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-border/70 text-neutral-500 hover:bg-neutral-50"
                    }`}
                  >
                    <span aria-hidden>👎</span>
                    {dupe.dislikes}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
