"use client";

import DupeCard from "./DupeCard";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider";
import FileInputZone from "./FileInputZone";
import Modal from "./Modal";
import { useToast } from "./ToastProvider";
import { compressImageForUpload } from "@/lib/compress-image-client";
import { prepareImageFile } from "@/lib/prepare-image-file";
import type { DupeSummary, DupeVoteType } from "@/lib/catalog-dupe-types";
import { dupeGuestHeaders } from "@/lib/dupe-guest-id";

export default function ItemDupesSection({
  catalogItemId,
  initialDupes,
}: {
  catalogItemId: string;
  initialDupes?: DupeSummary[];
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { showToast } = useToast();
  const [dupes, setDupes] = useState<DupeSummary[]>(initialDupes ?? []);
  const [loading, setLoading] = useState(initialDupes == null);
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

  const loadDupes = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/catalog-items/${catalogItemId}/dupes`, {
        headers: dupeGuestHeaders(),
        signal,
      });
      if (!res.ok) return;
      const data = (await res.json()) as { dupes?: DupeSummary[] };
      setDupes(data.dupes ?? []);
    } catch {
      if (signal?.aborted) return;
      /* ignore */
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, [catalogItemId]);

  useEffect(() => {
    if (initialDupes != null) {
      setDupes(initialDupes);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    void loadDupes(controller.signal);
    return () => controller.abort();
  }, [catalogItemId, initialDupes, loadDupes]);

  useEffect(() => {
    if (!formOpen) resetForm();
  }, [formOpen]);

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
      formData.append(
        "image",
        await compressImageForUpload(imageFile, "item")
      );

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
          <h2 className="text-base font-medium text-foreground">
            {t("dupe.sectionTitle")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="cursor-pointer text-sm text-foreground-secondary underline-offset-2 hover:text-foreground hover:underline"
        >
          {t("dupe.addDupe")}
        </button>
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={t("dupe.addDupe")}
        closeDisabled={submitting}
      >
        <form
          onSubmit={handleSubmit}
          className="max-h-[70vh] space-y-3 overflow-y-auto px-4 py-4"
        >
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder={`${t("dupe.brand")} *`}
            required
            className="ui-field w-full px-3 py-2 text-sm"
          />
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder={t("dupe.productName")}
            className="ui-field w-full px-3 py-2 text-sm"
          />
          <input
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            placeholder={t("dupe.priceRange")}
            className="ui-field w-full px-3 py-2 text-sm"
          />
          <input
            type="url"
            value={buyLink}
            onChange={(e) => setBuyLink(e.target.value)}
            placeholder={`${t("dupe.buyLink")} *`}
            required
            className="ui-field w-full px-3 py-2 text-sm"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t("dupe.notes")}
            className="ui-field w-full px-3 py-2 text-sm"
          />
          <FileInputZone onChange={handleImageSelect} disabled={submitting} />
          {imagePreview ? (
            <div className="item-image-surface relative h-24 w-24 overflow-hidden rounded-lg border border-border">
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
              className="ui-btn-secondary flex-1 px-4 py-2.5 text-sm"
            >
              {t("dupe.cancelAdd")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-fg disabled:opacity-50"
            >
              {submitting ? t("submit.submitting") : t("dupe.submitBtn")}
            </button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <p className="mt-4 text-sm text-muted">{t("loading")}</p>
      ) : dupes.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t("dupe.empty")}</p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
          {dupes.map((dupe) => (
            <li key={dupe.id} className="min-w-0">
              <DupeCard
                dupe={dupe}
                adminDelete={
                  isAdmin ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete(dupe.id)}
                      disabled={deletingId === dupe.id}
                      className="cursor-pointer text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === dupe.id ? "…" : t("dupe.delete")}
                    </button>
                  ) : null
                }
              />
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleVote(dupe.id, "like")}
                  className={`inline-flex cursor-pointer items-center gap-1 text-sm ${
                    dupe.userVote === "like"
                      ? "text-green-700"
                      : "text-muted hover:text-foreground-secondary"
                  }`}
                >
                  <span className="text-base" aria-hidden>
                    👍
                  </span>
                  {dupe.likes}
                </button>
                <button
                  type="button"
                  onClick={() => handleVote(dupe.id, "dislike")}
                  className={`inline-flex cursor-pointer items-center gap-1 text-sm ${
                    dupe.userVote === "dislike"
                      ? "text-red-600"
                      : "text-muted hover:text-foreground-secondary"
                  }`}
                >
                  <span className="text-base" aria-hidden>
                    👎
                  </span>
                  {dupe.dislikes}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
