"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import ItemTypeSelect from "./ItemTypeSelect";
import {
  normalizeItemType,
  type ItemType,
  type SubmissionItem,
  type SubmissionPayload,
} from "@/lib/types";

const emptyItem = (): SubmissionItem => ({
  type: "top_other",
  brand: "",
  productName: "",
  image: "",
  officialLink: "",
  notes: "",
});

const inputClass =
  "w-full min-w-0 rounded-md border border-border bg-white px-2 py-1.5 text-xs outline-none focus:border-neutral-400";

type Props = {
  submissionId: string;
  data: SubmissionPayload;
};

export default function AdminSubmissionInlineEdit({
  submissionId,
  data,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState<SubmissionPayload>(data);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dataKey = JSON.stringify(data);

  useEffect(() => {
    setForm(data);
    setError(null);
    setSaved(false);
  }, [submissionId, dataKey, data]);

  function updateField<K extends keyof SubmissionPayload>(
    field: K,
    value: SubmissionPayload[K]
  ) {
    setSaved(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateItem(
    index: number,
    field: keyof SubmissionItem,
    value: string
  ) {
    setSaved(false);
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addItem() {
    setSaved(false);
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  }

  function removeItem(index: number) {
    setSaved(false);
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const body = {
      eventName: form.eventName,
      date: form.date,
      mainImage: form.mainImage,
      items: form.items.filter(
        (item) =>
          item.brand ||
          item.productName ||
          item.image ||
          item.officialLink ||
          item.notes
      ),
    };

    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? t("admin.saveFail"));

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.saveFail"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className="text-[10px] text-muted">{t("submit.eventName")}</span>
          <input
            value={form.eventName}
            onChange={(e) => updateField("eventName", e.target.value)}
            className={`${inputClass} mt-0.5`}
          />
        </label>
        <label className="block min-w-0">
          <span className="text-[10px] text-muted">{t("submit.date")}</span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => updateField("date", e.target.value)}
            className={`${inputClass} mt-0.5`}
          />
        </label>
      </div>

      <div className="space-y-2">
        {form.items.length === 0 ? (
          <p className="text-xs text-muted">{t("outfit.noItems")}</p>
        ) : (
          form.items.map((item, index) => (
            <div
              key={index}
              className="space-y-1.5 rounded-lg border border-border bg-neutral-50 p-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium text-muted">
                  #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-[10px] text-red-500 hover:text-red-700"
                >
                  {t("submit.remove")}
                </button>
              </div>

              <ItemTypeSelect
                value={normalizeItemType(item.type)}
                onChange={(type: ItemType) => updateItem(index, "type", type)}
                className={`${inputClass} py-1`}
              />

              <div className="grid gap-1.5 sm:grid-cols-2">
                <input
                  value={item.brand ?? ""}
                  onChange={(e) => updateItem(index, "brand", e.target.value)}
                  placeholder={t("submit.brand")}
                  className={inputClass}
                />
                <input
                  value={item.productName ?? ""}
                  onChange={(e) =>
                    updateItem(index, "productName", e.target.value)
                  }
                  placeholder={t("submit.productName")}
                  className={inputClass}
                />
              </div>

              <input
                type="url"
                value={item.officialLink ?? ""}
                onChange={(e) =>
                  updateItem(index, "officialLink", e.target.value)
                }
                placeholder={t("outfit.officialLink")}
                className={inputClass}
              />

              <input
                value={item.notes ?? ""}
                onChange={(e) => updateItem(index, "notes", e.target.value)}
                placeholder={t("submit.notes")}
                className={inputClass}
              />
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="text-xs text-neutral-600 underline hover:text-neutral-900"
      >
        {t("admin.addItem")}
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {saving ? t("admin.saving") : t("admin.saveItems")}
        </button>
        {saved && (
          <span className="text-xs text-green-600">{t("admin.saveSuccess")}</span>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
