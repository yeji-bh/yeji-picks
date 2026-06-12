"use client";

import { useTranslation } from "react-i18next";
import BrandAutocomplete from "./BrandAutocomplete";
import FileInputZone from "./FileInputZone";
import ItemImagePreview from "./ItemImagePreview";
import ItemTypeSelect from "./ItemTypeSelect";
import type { ItemType } from "@/lib/types";

type LinkedCatalogItemEditorProps = {
  open: boolean;
  onToggle: () => void;
  catalogItemId: string;
  type: ItemType;
  brand: string;
  productName: string;
  image: string;
  imagePreview?: string;
  submitting?: boolean;
  onTypeChange: (type: ItemType) => void;
  onBrandChange: (brand: string) => void;
  onProductNameChange: (productName: string) => void;
  onImageSelect: (file: File | null) => void;
};

export default function LinkedCatalogItemEditor({
  open,
  onToggle,
  catalogItemId,
  type,
  brand,
  productName,
  image,
  imagePreview,
  submitting,
  onTypeChange,
  onBrandChange,
  onProductNameChange,
  onImageSelect,
}: LinkedCatalogItemEditorProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-border bg-subtle">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="text-xs font-medium text-foreground-secondary">
          {t("item.editLinkedCatalog")}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border px-3 pb-3 pt-2">
          <p className="text-xs text-muted">{t("item.editCatalogHint")}</p>
          <ItemTypeSelect
            value={type}
            onChange={onTypeChange}
            className="ui-field w-full px-3 py-2 text-sm"
          />
          <BrandAutocomplete
            value={brand}
            onChange={onBrandChange}
            placeholder={t("submit.brand")}
            className="ui-field w-full px-3 py-2 text-sm"
          />
          <input
            value={productName}
            onChange={(e) => onProductNameChange(e.target.value)}
            placeholder={t("submit.productName")}
            className="ui-field w-full px-3 py-2 text-sm"
          />
          <FileInputZone
            disabled={submitting}
            onChange={onImageSelect}
            className="w-full"
          />
          {(image || imagePreview) && (
            <ItemImagePreview
              src={imagePreview || image}
              alt={productName || t(`itemTypes.${type}`)}
            />
          )}
          <a
            href={`/item/${catalogItemId}/edit`}
            className="inline-block text-xs text-muted underline hover:text-foreground"
          >
            {t("item.openCatalogEditPage")}
          </a>
        </div>
      ) : null}
    </div>
  );
}
