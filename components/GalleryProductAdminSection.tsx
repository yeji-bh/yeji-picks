"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import FileInputZone from "./FileInputZone";
import { appendCompressedImagePair } from "@/lib/upload-form-images";
import { prepareImageFile } from "@/lib/prepare-image-file";
import AdminGalleryThumb from "./AdminGalleryThumb";

export type GalleryProductRow = {
  id: string;
  image: string;
  name: string;
  brand: string;
  officialLink: string;
  createdAt: string;
};

type GalleryProductAdminSectionProps = {
  uploadTitleKey: string;
  uploadDescKey: string;
  uploadBtnKey: string;
  uploadSuccessKey: string;
  existingTitleKey: string;
  emptyKey: string;
  listApiPath: string;
  uploadApiPath: string;
  deleteApiPath: string;
  listKey: "lovedItems" | "cosmetics";
};

export default function GalleryProductAdminSection({
  uploadTitleKey,
  uploadDescKey,
  uploadBtnKey,
  uploadSuccessKey,
  existingTitleKey,
  emptyKey,
  listApiPath,
  uploadApiPath,
  deleteApiPath,
  listKey,
}: GalleryProductAdminSectionProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<GalleryProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [officialLink, setOfficialLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadRows() {
    setLoading(true);
    try {
      const res = await fetch(listApiPath);
      if (res.ok) {
        const data = await res.json();
        setRows(data[listKey] ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, [listApiPath, listKey]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [imageFile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageFile || submitting) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const { file: prepared } = await prepareImageFile(imageFile);
      const formData = new FormData();
      await appendCompressedImagePair(
        formData,
        prepared,
        "item",
        imageFile.name
      );
      formData.append("name", name.trim());
      formData.append("brand", brand.trim());
      formData.append("officialLink", officialLink.trim());

      const res = await fetch(uploadApiPath, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("admin.gallery.uploadFail"));

      setRows((prev) => [data as GalleryProductRow, ...prev]);
      setImageFile(null);
      setName("");
      setBrand("");
      setOfficialLink("");
      setMessage(t(uploadSuccessKey));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("admin.gallery.uploadFail")
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`${deleteApiPath}?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(t("admin.gallery.deleteFail"));
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("admin.gallery.deleteFail")
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mt-6 space-y-6">
      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="rounded-xl border border-border bg-card p-4 sm:p-5"
      >
        <h2 className="text-base font-semibold text-foreground">
          {t(uploadTitleKey)}
        </h2>
        <p className="mt-1 text-sm text-muted">{t(uploadDescKey)}</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("admin.gallery.imageLabel")} *
            </label>
            <FileInputZone disabled={submitting} onChange={setImageFile} />
            {imagePreview && (
              <div className="relative mt-3 aspect-[3/4] w-full max-w-[12rem] overflow-hidden rounded-md bg-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("admin.gallery.nameLabel")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              className="box-border w-full rounded-sm border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-neutral-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("brand.label")}
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              disabled={submitting}
              className="box-border w-full rounded-sm border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-neutral-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("outfit.officialLink")}
            </label>
            <input
              type="url"
              value={officialLink}
              onChange={(e) => setOfficialLink(e.target.value)}
              disabled={submitting}
              placeholder="https://"
              className="box-border w-full rounded-sm border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !imageFile}
          className="mt-5 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? t("admin.processing") : t(uploadBtnKey)}
        </button>
      </form>

      <div>
        <h2 className="text-base font-semibold text-foreground">
          {t(existingTitleKey, { count: rows.length })}
        </h2>
        {loading ? (
          <p className="mt-4 text-sm text-muted">{t("loading")}</p>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{t(emptyKey)}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.map((row) => (
              <article
                key={row.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-subtle">
                  <AdminGalleryThumb
                    image={row.image}
                    alt={row.name || row.brand || ""}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {row.name || "—"}
                  </p>
                  {row.brand ? (
                    <p className="truncate text-sm text-muted">{row.brand}</p>
                  ) : null}
                  {row.officialLink ? (
                    <a
                      href={row.officialLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block truncate text-xs text-muted hover:underline"
                    >
                      {row.officialLink}
                    </a>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={deletingId === row.id}
                  onClick={() => void handleDelete(row.id)}
                  className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs text-red-600 hover:bg-subtle disabled:opacity-50"
                >
                  {deletingId === row.id
                    ? t("admin.processing")
                    : t("admin.gallery.delete")}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
