"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider";
import CoverImageCropper from "./CoverImageCropper";
import CoverImagePreview from "./CoverImagePreview";
import ItemImagePreview from "./ItemImagePreview";
import { useToast } from "./ToastProvider";
import { addSubmissionId, getSubmissionIdsQuery } from "@/lib/submissions";
import BrandAutocomplete from "./BrandAutocomplete";
import CatalogItemPicker, { type CatalogPick } from "./CatalogItemPicker";
import ItemTypeSelect from "./ItemTypeSelect";
import LinkedCatalogItemEditor from "./LinkedCatalogItemEditor";
import { prepareImageFile } from "@/lib/prepare-image-file";
import { uploadImageFile } from "@/lib/upload-client";
import {
  normalizeItemType,
  type ItemType,
  type SubmissionItem,
} from "@/lib/types";

type PendingItem = SubmissionItem & {
  imageFile?: File | null;
  imagePreview?: string;
  itemMode?: "new" | "link";
  catalogEditOpen?: boolean;
};

const emptyItem = (): PendingItem => ({
  type: "top_other",
  brand: "",
  productName: "",
  image: "",
  officialLink: "",
  notes: "",
  itemMode: "new",
});

function modeBtn(active: boolean): string {
  return `cursor-pointer rounded-full px-3 py-1 text-xs font-medium ${
    active
      ? "bg-neutral-900 text-white"
      : "border border-border bg-white text-neutral-600"
  }`;
}

export default function SubmitForm() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [mainImage, setMainImage] = useState("");
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState("");
  const [items, setItems] = useState<PendingItem[]>([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editId));
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [imagePreparing, setImagePreparing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropSrcRef = useRef<string | null>(null);

  function revokeCropSrc() {
    if (cropSrcRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(cropSrcRef.current);
    }
    cropSrcRef.current = null;
  }

  useEffect(() => {
    if (!editId) return;

    async function loadSubmission() {
      setLoadingEdit(true);
      try {
        const query = getSubmissionIdsQuery();
        const res = await fetch(
          `/api/submissions/${editId}${query ? `?${query}` : ""}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? t("submit.loadFail"));

        if (data.status !== "pending" && data.status !== "rejected") {
          throw new Error(t("submit.cannotEdit"));
        }

        const payload = data.payload;
        setEventName(payload.eventName ?? "");
        setDate(payload.date ?? "");
        setMainImage(payload.mainImage ?? "");
        setItems(
          payload.items?.length > 0
            ? payload.items.map((item: SubmissionItem) => ({
                catalogItemId: item.catalogItemId,
                type: normalizeItemType(item.type ?? "top_other"),
                brand: item.brand ?? "",
                productName: item.productName ?? "",
                image: item.image ?? "",
                officialLink: item.officialLink ?? "",
                notes: item.notes ?? "",
                itemMode: item.catalogItemId ? "link" : "new",
                catalogEditOpen: false,
              }))
            : [emptyItem()]
        );
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : t("submit.loadFail"),
          "error"
        );
      } finally {
        setLoadingEdit(false);
      }
    }

    loadSubmission();
  }, [editId, t]);

  useEffect(() => {
    return () => {
      revokeCropSrc();
      if (mainImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(mainImagePreview);
      }
      items.forEach((item) => {
        if (item.imagePreview?.startsWith("blob:")) {
          URL.revokeObjectURL(item.imagePreview);
        }
      });
    };
  }, [items, mainImagePreview]);

  async function handleMainImageSelect(file: File | null) {
    if (!file) return;
    revokeCropSrc();
    setImagePreparing(true);
    try {
      const previewUrl = (await prepareImageFile(file)).previewUrl;
      cropSrcRef.current = previewUrl;
      setCropImageSrc(previewUrl);
    } catch {
      showToast(t("feedback.imageUnsupported"), "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setImagePreparing(false);
    }
  }

  function handleCropConfirm(file: File) {
    revokeCropSrc();
    setCropImageSrc(null);
    if (mainImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(mainImagePreview);
    }
    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
    setMainImage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleCropCancel() {
    revokeCropSrc();
    setCropImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleItemImageSelect(index: number, file: File | null) {
    if (!file) return;
    try {
      const { file: prepared, previewUrl } = await prepareImageFile(file);
      setItems((prev) =>
        prev.map((item, i) => {
          if (i !== index) return item;
          if (item.imagePreview?.startsWith("blob:")) {
            URL.revokeObjectURL(item.imagePreview);
          }
          return {
            ...item,
            image: "",
            imageFile: prepared,
            imagePreview: previewUrl,
          };
        })
      );
    } catch {
      showToast(t("feedback.imageUnsupported"), "error");
    }
  }

  function updateItem(index: number, field: keyof SubmissionItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function toggleCatalogEdit(index: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, catalogEditOpen: !item.catalogEditOpen } : item
      )
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      let resolvedMainImage = mainImage;
      if (mainImageFile) {
        resolvedMainImage = await uploadImageFile(
          mainImageFile,
          t("submit.uploadFail"),
          "cover"
        );
      }

      const resolvedItems = await Promise.all(
        items
          .filter(
            (item) =>
              item.catalogItemId ||
              item.brand ||
              item.productName ||
              item.image ||
              item.imageFile ||
              item.officialLink ||
              item.notes
          )
          .map(async (item) => {
            if (item.catalogItemId) {
              let image = item.image ?? "";
              if (item.imageFile) {
                image = await uploadImageFile(
                  item.imageFile,
                  t("submit.uploadFail")
                );
              }
              return {
                catalogItemId: item.catalogItemId,
                type: item.type,
                brand: item.brand,
                productName: item.productName,
                image,
                officialLink: item.officialLink,
                notes: item.notes,
              };
            }

            let image = item.image ?? "";
            if (item.imageFile) {
              image = await uploadImageFile(
                item.imageFile,
                t("submit.uploadFail")
              );
            }
            return {
              type: item.type,
              brand: item.brand,
              productName: item.productName,
              image,
              officialLink: item.officialLink,
              notes: item.notes,
            };
          })
      );

      const body = {
        eventName,
        date,
        mainImage: resolvedMainImage,
        items: resolvedItems,
      };
      const query = getSubmissionIdsQuery();
      const res = await fetch(
        editId
          ? `/api/submissions/${editId}${query ? `?${query}` : ""}`
          : "/api/submit",
        {
          method: editId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("submit.submitFail"));

      if (editId) {
        showToast(t("submit.updateSuccess"));
      } else if (data.autoApproved) {
        if (!user) addSubmissionId(data.id);
        showToast(t("submit.autoApproved"));
        setEventName("");
        setDate("");
        setMainImage("");
        setMainImageFile(null);
        setMainImagePreview("");
        setItems([emptyItem()]);
      } else {
        if (!user) addSubmissionId(data.id);
        showToast(t("submit.submitSuccess"));
        setEventName("");
        setDate("");
        setMainImage("");
        setMainImageFile(null);
        setMainImagePreview("");
        setItems([emptyItem()]);
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("submit.submitFail"),
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const mainImageDisplay = mainImagePreview || mainImage;
  const hasMainImage = Boolean(mainImageDisplay);

  if (loadingEdit) {
    return <p className="text-sm text-muted">{t("loading")}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {editId && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("submit.editingHint")}
        </p>
      )}

      <section className="space-y-4 rounded-xl border border-border bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          {t("submit.outfitInfo")}
        </h2>

        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-muted">
              {t("submit.eventName")}{" "}
              <span className="text-neutral-400">({t("submit.optional")})</span>
            </span>
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </label>

          <label className="block">
            <span className="text-xs text-muted">
              {t("submit.date")}{" "}
              <span className="text-neutral-400">({t("submit.optional")})</span>
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </label>

          <div className="block">
            <span className="text-xs text-muted">{t("submit.mainImage")} *</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
              disabled={submitting || imagePreparing}
              onChange={(e) =>
                handleMainImageSelect(e.target.files?.[0] ?? null)
              }
              className="file-input-zone mt-1"
            />
            {imagePreparing && (
              <p className="mt-1 text-xs text-muted">{t("feedback.imageProcessing")}</p>
            )}
            {mainImageDisplay && (
              <div className="mt-3 space-y-2">
                <CoverImagePreview
                  src={mainImageDisplay}
                  alt="cover preview"
                  className="mx-auto"
                />
                <p className="text-xs text-green-600">
                  {t("submit.uploadMainDone")}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          {t("submit.items")}
        </h2>

        {items.map((item, index) => (
          <div
            key={index}
            className="space-y-3 rounded-xl border border-border bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted">#{index + 1}</span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  {t("submit.remove")}
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className={modeBtn(item.itemMode !== "link")}
                onClick={() =>
                  setItems((prev) =>
                    prev.map((row, i) =>
                      i === index
                        ? { ...emptyItem(), type: row.type, itemMode: "new" }
                        : row
                    )
                  )
                }
              >
                {t("item.modeNew")}
              </button>
              <button
                type="button"
                className={modeBtn(item.itemMode === "link")}
                onClick={() =>
                  setItems((prev) =>
                    prev.map((row, i) =>
                      i === index
                        ? {
                            ...row,
                            itemMode: "link",
                            catalogItemId: undefined,
                            brand: "",
                            productName: "",
                            image: "",
                            imageFile: null,
                            imagePreview: undefined,
                          }
                        : row
                    )
                  )
                }
              >
                {t("item.modeLink")}
              </button>
            </div>

            {item.itemMode === "link" ? (
              <>
                <CatalogItemPicker
                  selected={
                    item.catalogItemId
                      ? {
                          id: item.catalogItemId,
                          type: item.type,
                          brand: item.brand ?? null,
                          productName: item.productName ?? null,
                          image: item.image || item.imagePreview || null,
                          officialLink: item.officialLink ?? null,
                          notes: item.notes ?? null,
                          useCount: 0,
                        }
                      : null
                  }
                  onSelect={(picked: CatalogPick) =>
                    setItems((prev) =>
                      prev.map((row, i) =>
                        i === index
                          ? {
                              ...row,
                              itemMode: "link",
                              catalogEditOpen: false,
                              catalogItemId: picked.id,
                              type: picked.type as PendingItem["type"],
                              brand: picked.brand ?? "",
                              productName: picked.productName ?? "",
                              image: picked.image ?? "",
                              officialLink: picked.officialLink ?? "",
                              notes: picked.notes ?? "",
                            }
                          : row
                      )
                    )
                  }
                  onClear={() =>
                    setItems((prev) =>
                      prev.map((row, i) =>
                        i === index
                          ? { ...emptyItem(), itemMode: "link", catalogEditOpen: false }
                          : row
                      )
                    )
                  }
                />
                {item.catalogItemId ? (
                  <LinkedCatalogItemEditor
                    open={!!item.catalogEditOpen}
                    onToggle={() => toggleCatalogEdit(index)}
                    catalogItemId={item.catalogItemId}
                    type={item.type}
                    brand={item.brand ?? ""}
                    productName={item.productName ?? ""}
                    image={item.image ?? ""}
                    imagePreview={item.imagePreview}
                    submitting={submitting}
                    onTypeChange={(type) => updateItem(index, "type", type)}
                    onBrandChange={(brand) => updateItem(index, "brand", brand)}
                    onProductNameChange={(productName) =>
                      updateItem(index, "productName", productName)
                    }
                    onImageSelect={(file) => handleItemImageSelect(index, file)}
                  />
                ) : null}
              </>
            ) : (
              <>
                <label className="block">
                  <span className="text-xs text-muted">{t("submit.type")}</span>
                  <ItemTypeSelect
                    value={item.type}
                    onChange={(type) => updateItem(index, "type", type)}
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-muted">{t("submit.brand")}</span>
                  <BrandAutocomplete
                    value={item.brand ?? ""}
                    onChange={(brand) => updateItem(index, "brand", brand)}
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-muted">{t("submit.productName")}</span>
                  <input
                    value={item.productName ?? ""}
                    onChange={(e) =>
                      updateItem(index, "productName", e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-neutral-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-muted">{t("submit.itemImage")}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                    disabled={submitting}
                    onChange={(e) =>
                      handleItemImageSelect(index, e.target.files?.[0] ?? null)
                    }
                    className="file-input-zone mt-1"
                  />
                  {(item.image || item.imagePreview) && (
                    <div className="mt-2 flex items-center gap-2">
                      <ItemImagePreview
                        src={item.imagePreview || item.image || ""}
                        alt={item.productName || t(`itemTypes.${item.type}`)}
                      />
                      <p className="text-xs text-green-600">
                        {t("submit.uploadDone")}
                      </p>
                    </div>
                  )}
                </label>
              </>
            )}

            <label className="block">
              <span className="text-xs text-muted">{t("outfit.officialLink")}</span>
              <input
                type="url"
                value={item.officialLink ?? ""}
                onChange={(e) =>
                  updateItem(index, "officialLink", e.target.value)
                }
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-neutral-400"
                placeholder="https://"
              />
            </label>

            <label className="block">
              <span className="text-xs text-muted">{t("submit.notes")}</span>
              <textarea
                value={item.notes ?? ""}
                onChange={(e) => updateItem(index, "notes", e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
            </label>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="text-xs text-neutral-600 underline hover:text-neutral-900"
        >
          {t("submit.addItem")}
        </button>
      </section>

      <button
        type="submit"
        disabled={submitting || !hasMainImage}
        className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting
          ? t("submit.submitting")
          : editId
            ? t("submit.updateBtn")
            : t("submit.submitBtn")}
      </button>

      {cropImageSrc && (
        <CoverImageCropper
          imageSrc={cropImageSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </form>
  );
}
