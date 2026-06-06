"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import CoverImageCropper from "./CoverImageCropper";
import CoverImagePreview from "./CoverImagePreview";
import ItemImagePreview from "./ItemImagePreview";
import { useToast } from "./ToastProvider";
import BrandAutocomplete from "./BrandAutocomplete";
import CatalogItemPicker, { type CatalogPick } from "./CatalogItemPicker";
import ItemTypeSelect from "./ItemTypeSelect";
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

export default function OutfitEditForm({ outfitId }: { outfitId: string }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [mainImage, setMainImage] = useState("");
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState("");
  const [items, setItems] = useState<PendingItem[]>([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
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
    async function load() {
      try {
        const res = await fetch(`/api/outfits/${outfitId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? t("submit.loadFail"));

        setEventName(data.eventName ?? "");
        setDate(data.date ?? "");
        setMainImage(data.mainImage ?? "");
        setItems(
          data.items?.length > 0
            ? data.items.map(
                (item: SubmissionItem & { catalogItemId?: string }) => ({
                  catalogItemId: item.catalogItemId,
                  type: normalizeItemType(item.type ?? "top_other"),
                  brand: item.brand ?? "",
                  productName: item.productName ?? "",
                  image: item.image ?? "",
                  officialLink: item.officialLink ?? "",
                  notes: item.notes ?? "",
                  itemMode: item.catalogItemId ? "link" : "new",
                })
              )
            : [emptyItem()]
        );
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : t("submit.loadFail"),
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [outfitId, t]);

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

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof SubmissionItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
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

      const res = await fetch(`/api/outfits/${outfitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName,
          date,
          mainImage: resolvedMainImage,
          items: resolvedItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("submit.submitFail"));

      showToast(t("submit.updateSuccess"));
      router.push(`/outfit/${outfitId}`);
      router.refresh();
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

  if (loading) {
    return <p className="text-sm text-muted">{t("loading")}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4 rounded-xl border border-border bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          {t("submit.outfitInfo")}
        </h2>
        <label className="block">
          <span className="text-xs text-muted">{t("submit.eventName")}</span>
          <input
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">{t("submit.date")}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </label>
        <div className="block">
          <span className="text-xs text-muted">{t("submit.mainImage")} *</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
            disabled={submitting || imagePreparing}
            onChange={(e) => handleMainImageSelect(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm"
          />
          {imagePreparing && (
            <p className="mt-1 text-xs text-muted">{t("feedback.imageProcessing")}</p>
          )}
          {mainImageDisplay && (
            <CoverImagePreview
              src={mainImageDisplay}
              alt="cover"
              className="mx-auto mt-3"
            />
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-neutral-900">{t("submit.items")}</h2>
        {items.map((item, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-border bg-white p-4">
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
                      i === index ? { ...emptyItem(), itemMode: "link" } : row
                    )
                  )
                }
              />
            ) : (
              <>
                <ItemTypeSelect
                  value={item.type}
                  onChange={(type) => updateItem(index, "type", type)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
                <BrandAutocomplete
                  value={item.brand ?? ""}
                  onChange={(brand) => updateItem(index, "brand", brand)}
                  placeholder={t("submit.brand")}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
                <input
                  value={item.productName ?? ""}
                  onChange={(e) =>
                    updateItem(index, "productName", e.target.value)
                  }
                  placeholder={t("submit.productName")}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                  disabled={submitting}
                  onChange={(e) =>
                    handleItemImageSelect(index, e.target.files?.[0] ?? null)
                  }
                  className="w-full text-sm"
                />
                {(item.image || item.imagePreview) && (
                  <div className="mt-2">
                    <ItemImagePreview
                      src={item.imagePreview || item.image || ""}
                      alt={item.productName || t("submit.itemImage")}
                    />
                  </div>
                )}
              </>
            )}
            <input
              type="url"
              value={item.officialLink ?? ""}
              onChange={(e) => updateItem(index, "officialLink", e.target.value)}
              placeholder={t("outfit.officialLink")}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
            <textarea
              value={item.notes ?? ""}
              onChange={(e) => updateItem(index, "notes", e.target.value)}
              rows={2}
              placeholder={t("submit.notes")}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
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
        {submitting ? t("submit.submitting") : t("submit.updateBtn")}
      </button>

      {cropImageSrc && (
        <CoverImageCropper
          imageSrc={cropImageSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => {
            revokeCropSrc();
            setCropImageSrc(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      )}
    </form>
  );
}
