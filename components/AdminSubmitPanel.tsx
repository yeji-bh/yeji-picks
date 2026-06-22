"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import FileInputZone, { IMAGE_FILE_ACCEPT } from "./FileInputZone";
import ProgressiveImage from "./ProgressiveImage";
import SubmitForm from "./SubmitForm";
import { useAssetUrl } from "@/lib/use-asset-url";
import { appendCompressedImagePair } from "@/lib/upload-form-images";
import { prepareImageFile } from "@/lib/prepare-image-file";

type SubmitTab = "outfit" | "nailArt" | "phoneCase" | "perfume";

type NailArtRow = {
  id: string;
  image: string;
  createdAt: string;
};

type PhoneCaseRow = {
  id: string;
  image: string;
  brand: string;
  model: string;
  officialLink: string;
  createdAt: string;
};

type PerfumeRow = {
  id: string;
  image: string;
  name: string;
  brand: string;
  description: string;
  officialLink: string;
  createdAt: string;
};

type PendingFile = {
  id: string;
  file: File;
  previewUrl: string;
};

const MAX_BATCH_SIZE = 50;
const UPLOAD_CHUNK_SIZE = 15;

function AdminGalleryThumb({
  image,
  alt,
}: {
  image: string;
  alt: string;
}) {
  const src = useAssetUrl(image);
  return (
    <ProgressiveImage
      src={src}
      uploadPath={image}
      alt={alt}
      fill
      className="object-cover"
      sizes="120px"
    />
  );
}

export default function AdminSubmitPanel() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<SubmitTab>("outfit");
  const [nailArts, setNailArts] = useState<NailArtRow[]>([]);
  const [phoneCases, setPhoneCases] = useState<PhoneCaseRow[]>([]);
  const [perfumes, setPerfumes] = useState<PerfumeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [phoneImageFile, setPhoneImageFile] = useState<File | null>(null);
  const [phoneImagePreview, setPhoneImagePreview] = useState<string | null>(null);
  const [phoneBrand, setPhoneBrand] = useState("");
  const [phoneModel, setPhoneModel] = useState("");
  const [phoneOfficialLink, setPhoneOfficialLink] = useState("");
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [perfumeImageFile, setPerfumeImageFile] = useState<File | null>(null);
  const [perfumeImagePreview, setPerfumeImagePreview] = useState<string | null>(null);
  const [perfumeName, setPerfumeName] = useState("");
  const [perfumeBrand, setPerfumeBrand] = useState("");
  const [perfumeDescription, setPerfumeDescription] = useState("");
  const [perfumeOfficialLink, setPerfumeOfficialLink] = useState("");
  const [perfumeSubmitting, setPerfumeSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [nailRes, phoneRes, perfumeRes] = await Promise.all([
        fetch("/api/admin/nail-arts"),
        fetch("/api/admin/phone-cases"),
        fetch("/api/admin/perfumes"),
      ]);
      if (nailRes.ok) {
        const data = await nailRes.json();
        setNailArts(data.nailArts ?? []);
      }
      if (phoneRes.ok) {
        const data = await phoneRes.json();
        setPhoneCases(data.phoneCases ?? []);
      }
      if (perfumeRes.ok) {
        const data = await perfumeRes.json();
        setPerfumes(data.perfumes ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    return () => {
      for (const item of pendingFiles) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, [pendingFiles]);

  useEffect(() => {
    if (!phoneImageFile) {
      setPhoneImagePreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(phoneImageFile);
    setPhoneImagePreview(previewUrl);
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [phoneImageFile]);

  useEffect(() => {
    if (!perfumeImageFile) {
      setPerfumeImagePreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(perfumeImageFile);
    setPerfumeImagePreview(previewUrl);
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [perfumeImageFile]);

  function handlePhoneImageChange(file: File | null) {
    setPhoneImageFile(file);
  }

  function clearPendingFiles() {
    for (const item of pendingFiles) {
      URL.revokeObjectURL(item.previewUrl);
    }
    setPendingFiles([]);
    if (batchInputRef.current) batchInputRef.current.value = "";
  }

  function handleBatchSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setMessage(null);

    const next = Array.from(files).slice(0, MAX_BATCH_SIZE).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPendingFiles((prev) => {
      const seen = new Set(prev.map((item) => item.id));
      const merged = [...prev];
      for (const item of next) {
        if (!seen.has(item.id)) merged.push(item);
      }
      return merged.slice(0, MAX_BATCH_SIZE);
    });
  }

  async function handleBatchUpload() {
    if (pendingFiles.length === 0 || uploading) return;
    setUploading(true);
    setError(null);
    setMessage(null);
    setUploadProgress({ done: 0, total: pendingFiles.length });

    const created: NailArtRow[] = [];
    let compressed = 0;

    try {
      for (let offset = 0; offset < pendingFiles.length; offset += UPLOAD_CHUNK_SIZE) {
        const chunk = pendingFiles.slice(offset, offset + UPLOAD_CHUNK_SIZE);
        const formData = new FormData();

        for (const item of chunk) {
          const { file: prepared } = await prepareImageFile(item.file);
          await appendCompressedImagePair(
            formData,
            prepared,
            "item",
            item.file.name,
            { fileField: "files", thumbField: "thumbs" }
          );
          compressed += 1;
          setUploadProgress({ done: compressed, total: pendingFiles.length });
        }

        const res = await fetch("/api/admin/nail-arts/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? t("admin.gallery.uploadFail"));
        }
        created.push(...(data.nailArts as NailArtRow[]));
      }

      setNailArts((prev) => [...created, ...prev]);
      setMessage(
        t("admin.gallery.nailArtUploadSuccess", { count: created.length })
      );
      clearPendingFiles();
    } catch (err) {
      if (created.length > 0) {
        setNailArts((prev) => [...created, ...prev]);
        setPendingFiles((prev) => prev.slice(created.length));
        setMessage(
          t("admin.gallery.nailArtUploadPartial", { count: created.length })
        );
      }
      setError(
        err instanceof Error ? err.message : t("admin.gallery.uploadFail")
      );
    } finally {
      setUploading(false);
      setUploadProgress({ done: 0, total: 0 });
    }
  }

  async function handleDeleteNailArt(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/nail-arts?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(t("admin.gallery.deleteFail"));
      setNailArts((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("admin.gallery.deleteFail")
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !phoneImageFile ||
      !phoneBrand.trim() ||
      !phoneModel.trim() ||
      !phoneOfficialLink.trim() ||
      phoneSubmitting
    ) {
      return;
    }

    setPhoneSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const { file: prepared } = await prepareImageFile(phoneImageFile);
      const formData = new FormData();
      await appendCompressedImagePair(
        formData,
        prepared,
        "item",
        phoneImageFile.name
      );
      formData.append("brand", phoneBrand.trim());
      formData.append("model", phoneModel.trim());
      formData.append("officialLink", phoneOfficialLink.trim());

      const res = await fetch("/api/admin/phone-cases/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("admin.gallery.uploadFail"));

      setPhoneCases((prev) => [data as PhoneCaseRow, ...prev]);
      setPhoneImageFile(null);
      setPhoneBrand("");
      setPhoneModel("");
      setPhoneOfficialLink("");
      setMessage(t("admin.gallery.phoneCaseUploadSuccess"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("admin.gallery.uploadFail")
      );
    } finally {
      setPhoneSubmitting(false);
    }
  }

  async function handleDeletePhoneCase(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/phone-cases?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(t("admin.gallery.deleteFail"));
      setPhoneCases((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("admin.gallery.deleteFail")
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handlePerfumeImageChange(file: File | null) {
    setPerfumeImageFile(file);
  }

  async function handlePerfumeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !perfumeImageFile ||
      !perfumeName.trim() ||
      !perfumeBrand.trim() ||
      !perfumeOfficialLink.trim() ||
      perfumeSubmitting
    ) {
      return;
    }

    setPerfumeSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const { file: prepared } = await prepareImageFile(perfumeImageFile);
      const formData = new FormData();
      await appendCompressedImagePair(
        formData,
        prepared,
        "item",
        perfumeImageFile.name
      );
      formData.append("name", perfumeName.trim());
      formData.append("brand", perfumeBrand.trim());
      formData.append("description", perfumeDescription.trim());
      formData.append("officialLink", perfumeOfficialLink.trim());

      const res = await fetch("/api/admin/perfumes/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("admin.gallery.uploadFail"));

      setPerfumes((prev) => [data as PerfumeRow, ...prev]);
      setPerfumeImageFile(null);
      setPerfumeName("");
      setPerfumeBrand("");
      setPerfumeDescription("");
      setPerfumeOfficialLink("");
      setMessage(t("admin.gallery.perfumeUploadSuccess"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("admin.gallery.uploadFail")
      );
    } finally {
      setPerfumeSubmitting(false);
    }
  }

  async function handleDeletePerfume(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/perfumes?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(t("admin.gallery.deleteFail"));
      setPerfumes((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("admin.gallery.deleteFail")
      );
    } finally {
      setDeletingId(null);
    }
  }

  const tabClass = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
      active
        ? "bg-neutral-900 text-white"
        : "border border-border bg-white text-neutral-600"
    }`;

  return (
    <div className="min-w-0">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-neutral-900 sm:text-2xl">
          {t("submit.adminTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("submit.adminDesc")}</p>
        <Link
          href="/my-submissions"
          className="mt-2 inline-block text-sm text-foreground-secondary underline hover:text-foreground"
        >
          {t("mySubmissions.viewHistory")}
        </Link>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => setTab("outfit")}
          className={tabClass(tab === "outfit")}
        >
          {t("home.modeOutfit")}
        </button>
        <button
          type="button"
          onClick={() => setTab("nailArt")}
          className={tabClass(tab === "nailArt")}
        >
          {t("home.modeNailArt")}
        </button>
        <button
          type="button"
          onClick={() => setTab("phoneCase")}
          className={tabClass(tab === "phoneCase")}
        >
          {t("home.modePhoneCase")}
        </button>
        <button
          type="button"
          onClick={() => setTab("perfume")}
          className={tabClass(tab === "perfume")}
        >
          {t("home.modePerfume")}
        </button>
      </div>

      {message && (
        <p className="mt-4 text-sm text-green-600">{message}</p>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {tab === "outfit" ? (
        <section className="mt-6">
          <Suspense fallback={<p className="text-sm text-muted">{t("loading")}</p>}>
            <SubmitForm />
          </Suspense>
        </section>
      ) : tab === "nailArt" ? (
        <section className="mt-6 space-y-6">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <h2 className="text-base font-semibold text-foreground">
              {t("admin.gallery.nailArtUploadTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {t("admin.gallery.nailArtUploadDesc")}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={uploading}
                onClick={() => batchInputRef.current?.click()}
                className="file-input-zone-btn"
              >
                {t("admin.gallery.chooseImages")}
              </button>
              <input
                ref={batchInputRef}
                type="file"
                accept={IMAGE_FILE_ACCEPT}
                multiple
                disabled={uploading}
                className="sr-only"
                onChange={(e) => handleBatchSelect(e.target.files)}
              />
              {pendingFiles.length > 0 && (
                <>
                  <span className="text-sm text-muted">
                    {t("admin.gallery.selectedCount", {
                      count: pendingFiles.length,
                    })}
                  </span>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={clearPendingFiles}
                    className="text-sm text-muted hover:text-foreground"
                  >
                    {t("admin.gallery.clearSelection")}
                  </button>
                </>
              )}
            </div>

            {pendingFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {pendingFiles.map((item) => (
                  <div
                    key={item.id}
                    className="relative aspect-square overflow-hidden rounded-md bg-subtle"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={uploading || pendingFiles.length === 0}
                onClick={() => void handleBatchUpload()}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {uploading
                  ? t("admin.gallery.uploadingProgress", uploadProgress)
                  : t("admin.gallery.uploadBatch")}
              </button>
              <p className="text-xs text-muted">
                {t("admin.gallery.batchLimit", { count: MAX_BATCH_SIZE })}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground">
              {t("admin.gallery.existingNailArts", { count: nailArts.length })}
            </h2>
            {loading ? (
              <p className="mt-4 text-sm text-muted">{t("loading")}</p>
            ) : nailArts.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                {t("home.noNailArts")}
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {nailArts.map((row) => (
                  <div key={row.id} className="space-y-2">
                    <div className="relative aspect-square overflow-hidden rounded-md bg-subtle">
                      <AdminGalleryThumb image={row.image} alt="" />
                    </div>
                    <button
                      type="button"
                      disabled={deletingId === row.id}
                      onClick={() => void handleDeleteNailArt(row.id)}
                      className="w-full rounded-md border border-border px-2 py-1 text-xs text-red-600 hover:bg-subtle disabled:opacity-50"
                    >
                      {deletingId === row.id
                        ? t("admin.processing")
                        : t("admin.gallery.delete")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : tab === "phoneCase" ? (
        <section className="mt-6 space-y-6">
          <form
            onSubmit={(e) => void handlePhoneSubmit(e)}
            className="rounded-xl border border-border bg-card p-4 sm:p-5"
          >
            <h2 className="text-base font-semibold text-foreground">
              {t("admin.gallery.phoneCaseUploadTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {t("admin.gallery.phoneCaseUploadDesc")}
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("admin.gallery.imageLabel")}
                </label>
                <FileInputZone
                  disabled={phoneSubmitting}
                  onChange={handlePhoneImageChange}
                />
                {phoneImagePreview && (
                  <div className="relative mt-3 aspect-[3/4] w-full max-w-[12rem] overflow-hidden rounded-md bg-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={phoneImagePreview}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("brand.label")}
                </label>
                <input
                  type="text"
                  value={phoneBrand}
                  onChange={(e) => setPhoneBrand(e.target.value)}
                  disabled={phoneSubmitting}
                  className="box-border w-full rounded-sm border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-neutral-400"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("admin.gallery.modelLabel")}
                </label>
                <input
                  type="text"
                  value={phoneModel}
                  onChange={(e) => setPhoneModel(e.target.value)}
                  disabled={phoneSubmitting}
                  className="box-border w-full rounded-sm border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-neutral-400"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("outfit.officialLink")}
                </label>
                <input
                  type="url"
                  value={phoneOfficialLink}
                  onChange={(e) => setPhoneOfficialLink(e.target.value)}
                  disabled={phoneSubmitting}
                  placeholder="https://"
                  className="box-border w-full rounded-sm border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-neutral-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={
                phoneSubmitting ||
                !phoneImageFile ||
                !phoneBrand.trim() ||
                !phoneModel.trim() ||
                !phoneOfficialLink.trim()
              }
              className="mt-5 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {phoneSubmitting
                ? t("admin.processing")
                : t("admin.gallery.uploadPhoneCase")}
            </button>
          </form>

          <div>
            <h2 className="text-base font-semibold text-foreground">
              {t("admin.gallery.existingPhoneCases", {
                count: phoneCases.length,
              })}
            </h2>
            {loading ? (
              <p className="mt-4 text-sm text-muted">{t("loading")}</p>
            ) : phoneCases.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                {t("home.noPhoneCases")}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {phoneCases.map((row) => (
                  <article
                    key={row.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-subtle">
                      <AdminGalleryThumb
                        image={row.image}
                        alt={`${row.brand} ${row.model}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {row.brand}
                      </p>
                      <p className="truncate text-sm text-muted">{row.model}</p>
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
                      onClick={() => void handleDeletePhoneCase(row.id)}
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
      ) : (
        <section className="mt-6 space-y-6">
          <form
            onSubmit={(e) => void handlePerfumeSubmit(e)}
            className="rounded-xl border border-border bg-card p-4 sm:p-5"
          >
            <h2 className="text-base font-semibold text-foreground">
              {t("admin.gallery.perfumeUploadTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {t("admin.gallery.perfumeUploadDesc")}
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("admin.gallery.imageLabel")}
                </label>
                <FileInputZone
                  disabled={perfumeSubmitting}
                  onChange={handlePerfumeImageChange}
                />
                {perfumeImagePreview && (
                  <div className="relative mt-3 aspect-[3/4] w-full max-w-[12rem] overflow-hidden rounded-md bg-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={perfumeImagePreview}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("brand.label")}
                </label>
                <input
                  type="text"
                  value={perfumeBrand}
                  onChange={(e) => setPerfumeBrand(e.target.value)}
                  disabled={perfumeSubmitting}
                  className="box-border w-full rounded-sm border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-neutral-400"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("admin.gallery.nameLabel")}
                </label>
                <input
                  type="text"
                  value={perfumeName}
                  onChange={(e) => setPerfumeName(e.target.value)}
                  disabled={perfumeSubmitting}
                  className="box-border w-full rounded-sm border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-neutral-400"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("admin.gallery.descriptionLabel")}
                </label>
                <textarea
                  value={perfumeDescription}
                  onChange={(e) => setPerfumeDescription(e.target.value)}
                  disabled={perfumeSubmitting}
                  rows={3}
                  className="box-border w-full resize-y rounded-sm border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("outfit.officialLink")}
                </label>
                <input
                  type="url"
                  value={perfumeOfficialLink}
                  onChange={(e) => setPerfumeOfficialLink(e.target.value)}
                  disabled={perfumeSubmitting}
                  placeholder="https://"
                  className="box-border w-full rounded-sm border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-neutral-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={
                perfumeSubmitting ||
                !perfumeImageFile ||
                !perfumeName.trim() ||
                !perfumeBrand.trim() ||
                !perfumeOfficialLink.trim()
              }
              className="mt-5 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {perfumeSubmitting
                ? t("admin.processing")
                : t("admin.gallery.uploadPerfume")}
            </button>
          </form>

          <div>
            <h2 className="text-base font-semibold text-foreground">
              {t("admin.gallery.existingPerfumes", {
                count: perfumes.length,
              })}
            </h2>
            {loading ? (
              <p className="mt-4 text-sm text-muted">{t("loading")}</p>
            ) : perfumes.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                {t("home.noPerfumes")}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {perfumes.map((row) => (
                  <article
                    key={row.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-subtle">
                      <AdminGalleryThumb
                        image={row.image}
                        alt={`${row.brand} ${row.name}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {row.brand}
                      </p>
                      <p className="truncate text-sm text-muted">{row.name}</p>
                      {row.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                          {row.description}
                        </p>
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
                      onClick={() => void handleDeletePerfume(row.id)}
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
      )}
    </div>
  );
}
