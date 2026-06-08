"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import BrandAutocomplete from "./BrandAutocomplete";
import FileInputZone from "./FileInputZone";
import ItemImagePreview from "./ItemImagePreview";
import ItemTypeSelect from "./ItemTypeSelect";
import { useToast } from "./ToastProvider";
import { prepareImageFile } from "@/lib/prepare-image-file";
import { normalizeItemType, type ItemType } from "@/lib/types";
import { uploadImageFile } from "@/lib/upload-client";
import { itemHref } from "@/lib/entity-href";

export default function CatalogItemEditForm({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<ItemType>("top_other");
  const [brand, setBrand] = useState("");
  const [productName, setProductName] = useState("");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [officialLink, setOfficialLink] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/catalog-items/${itemId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? t("submit.loadFail"));

        setType(normalizeItemType(data.type ?? "top_other"));
        setBrand(data.brand ?? "");
        setProductName(data.productName ?? "");
        setImage(data.image ?? "");
        setOfficialLink(data.officialLink ?? "");
        setNotes(data.notes ?? "");
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
  }, [itemId, showToast, t]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  async function handleImageSelect(file: File | null) {
    if (!file) return;
    try {
      const { file: prepared, previewUrl } = await prepareImageFile(file);
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(prepared);
      setImagePreview(previewUrl);
      setImage("");
    } catch {
      showToast(t("feedback.imageUnsupported"), "error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      let resolvedImage = image;
      if (imageFile) {
        resolvedImage = await uploadImageFile(
          imageFile,
          t("submit.uploadFail")
        );
      }

      const res = await fetch(`/api/catalog-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          brand,
          productName,
          image: resolvedImage || undefined,
          officialLink,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("submit.submitFail"));

      showToast(t("item.catalogUpdateSuccess"));
      router.push(itemHref({ id: itemId, productName, brand, type }));
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

  if (loading) {
    return <p className="text-sm text-muted">{t("loading")}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href={itemHref({ id: itemId, productName, brand, type })}
          className="text-xs text-muted hover:text-neutral-900 sm:text-sm"
        >
          ← {t("item.backDetail")}
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-neutral-900">
          {t("item.catalogEditTitle")}
        </h1>
        <p className="mt-1 text-xs text-muted">{t("item.editCatalogHint")}</p>
      </div>

      <section className="space-y-3 rounded-xl border border-border bg-white p-4">
        <ItemTypeSelect
          value={type}
          onChange={setType}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
        <BrandAutocomplete
          value={brand}
          onChange={setBrand}
          placeholder={t("submit.brand")}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder={t("submit.productName")}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
        <FileInputZone
          disabled={submitting}
          onChange={handleImageSelect}
          className="w-full"
        />
        {(image || imagePreview) && (
          <ItemImagePreview
            src={imagePreview || image}
            alt={productName || t(`itemTypes.${type}`)}
          />
        )}
        <input
          type="url"
          value={officialLink}
          onChange={(e) => setOfficialLink(e.target.value)}
          placeholder={t("outfit.officialLink")}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={t("submit.notes")}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </section>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? t("submit.submitting") : t("item.catalogUpdateBtn")}
      </button>
    </form>
  );
}
