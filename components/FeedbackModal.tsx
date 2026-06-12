"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { prepareImageFile } from "@/lib/prepare-image-file";
import FileInputZone from "./FileInputZone";
import Modal from "./Modal";
import { useToast } from "./ToastProvider";

export type FeedbackCategory = "suggestion" | "same_style";

const CATEGORY_OPTIONS: FeedbackCategory[] = ["suggestion", "same_style"];

export default function FeedbackModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<FeedbackCategory>("suggestion");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setCategory("suggestion");
    setMessage("");
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageProcessing(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  async function handleImageSelect(file: File | null) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    setImageProcessing(true);
    setError(null);
    try {
      const { file: prepared, previewUrl } = await prepareImageFile(file);
      setImageFile(prepared);
      setImagePreview(previewUrl);
    } catch {
      setImageFile(null);
      setImagePreview(null);
      setError(t("feedback.imageUnsupported"));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setImageProcessing(false);
    }
  }

  function handleRemoveImage() {
    handleImageSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("message", message);
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch("/api/feedback", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("feedback.fail"));

      resetForm();
      onClose();
      showToast(t("feedback.success"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("feedback.fail"));
    } finally {
      setLoading(false);
    }
  }

  const placeholder =
    category === "same_style"
      ? t("feedback.placeholderSameStyle")
      : t("feedback.placeholderSuggestion");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("feedback.title")}
      closeDisabled={loading}
    >
      <form onSubmit={handleSubmit} className="space-y-3 px-4 py-4">
          <label className="block">
            <span className="text-xs text-muted">{t("feedback.categoryLabel")}</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              className="filter-select mt-1 box-border h-10 w-full cursor-pointer rounded-lg border border-border bg-white px-3 pr-8 text-sm text-neutral-900 outline-none focus:border-neutral-400"
            >
              {CATEGORY_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`feedback.category.${value}`)}
                </option>
              ))}
            </select>
          </label>

          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder={placeholder}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />

          <div className="block">
            <span className="text-xs text-muted">{t("feedback.imageLabel")}</span>
            <FileInputZone
              ref={fileInputRef}
              disabled={loading || imageProcessing}
              onChange={handleImageSelect}
              className="mt-1"
            />
            {imageProcessing && (
              <p className="mt-1 text-xs text-muted">{t("feedback.imageProcessing")}</p>
            )}
            {imagePreview && !imageProcessing && (
              <div className="mt-2 flex items-start gap-3">
                <img
                  src={imagePreview}
                  alt=""
                  className="h-24 w-24 rounded-lg border border-border bg-white object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={loading}
                  className="text-xs text-muted underline hover:text-neutral-900 disabled:opacity-50"
                >
                  {t("feedback.removeImage")}
                </button>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-neutral-700 disabled:opacity-50"
            >
              {t("feedback.close")}
            </button>
            <button
              type="submit"
              disabled={loading || imageProcessing}
              className="flex-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? t("feedback.sending") : t("feedback.submit")}
            </button>
          </div>
      </form>
    </Modal>
  );
}
