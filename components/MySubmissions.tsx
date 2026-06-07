"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider";
import type { SubmissionRecord } from "./SubmissionsPanel";
import { formatOutfitTitle } from "@/lib/outfit";
import { clearBrowserDataAfterSync } from "@/lib/clear-browser-data";
import {
  getSubmissionIds,
  getSubmissionIdsQuery,
  removeSubmissionId,
} from "@/lib/submissions";
import type { SubmissionStatus } from "@/lib/types";

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function MySubmissions({
  isAdmin = false,
  initialRecords = [],
}: {
  isAdmin?: boolean;
  initialRecords?: SubmissionRecord[];
}) {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [records, setRecords] = useState<SubmissionRecord[]>(initialRecords);
  const [loading, setLoading] = useState(initialRecords.length === 0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (initialRecords.length > 0 && user) return;

    setLoading(true);
    try {
      const localQuery = getSubmissionIdsQuery();
      const url = `/api/submissions/mine${localQuery ? `?${localQuery}` : ""}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error();

      const fetched = data as SubmissionRecord[];

      if (user) {
        if (getSubmissionIds().length > 0) {
          clearBrowserDataAfterSync();
        }
      } else {
        const ids = getSubmissionIds();
        const fetchedIds = new Set(fetched.map((r) => r.id));
        const staleIds = ids.filter((id) => !fetchedIds.has(id));
        staleIds.forEach((id) => removeSubmissionId(id));
      }

      setRecords(fetched);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [user, initialRecords.length]);

  useEffect(() => {
    if (authLoading) return;
    if (initialRecords.length > 0 && user) {
      setRecords(initialRecords);
      setLoading(false);
      return;
    }
    load();
  }, [authLoading, user, initialRecords, load]);

  async function handleDelete(id: string) {
    if (!confirm(t("mySubmissions.deleteConfirm"))) return;

    setDeletingId(id);
    try {
      const query = getSubmissionIdsQuery();
      const res = await fetch(
        `/api/submissions/${id}${query ? `?${query}` : ""}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("mySubmissions.deleteFail"));

      removeSubmissionId(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : t("mySubmissions.deleteFail"));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading || authLoading) {
    return <p className="text-sm text-muted">{t("loading")}</p>;
  }

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-neutral-50 px-4 py-10 text-center">
        <p className="text-sm text-neutral-700">{t("mySubmissions.empty")}</p>
        <Link
          href="/submit"
          className="mt-4 inline-block text-sm text-neutral-900 underline"
        >
          {t("nav.submit")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => {
        const title = formatOutfitTitle(
          record.payload.date,
          record.payload.eventName
        );
        const displayTitle =
          title === "outfit" ? t("outfit.unnamed") : title;
        const dateStr = new Date(record.createdAt).toLocaleDateString();
        const canEditContent =
          record.status === "pending" || record.status === "rejected";

        return (
          <article
            key={record.id}
            className="flex gap-3 rounded-xl border border-border bg-white p-3 sm:gap-4 sm:p-4"
          >
            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-neutral-100 sm:h-24 sm:w-[72px]">
              <Image
                src={record.payload.mainImage}
                alt={displayTitle}
                fill
                className="object-cover"
                sizes="72px"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-neutral-900">
                    {displayTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {t("mySubmissions.submittedAt", { date: dateStr })}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[record.status]}`}
                >
                  {t(`mySubmissions.status.${record.status}`)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                {canEditContent && (
                  <Link
                    href={`/submit?edit=${record.id}`}
                    className="text-neutral-700 underline hover:text-neutral-900"
                  >
                    {t("mySubmissions.edit")}
                  </Link>
                )}
                {record.status === "approved" && record.outfitId && (
                  <>
                    <Link
                      href={`/outfit/${record.outfitId}`}
                      className="text-neutral-700 underline hover:text-neutral-900"
                    >
                      {t("mySubmissions.viewOutfit")}
                    </Link>
                    {isAdmin && (
                      <Link
                        href={`/outfit/${record.outfitId}/edit`}
                        className="text-neutral-700 underline hover:text-neutral-900"
                      >
                        {t("mySubmissions.editOutfit")}
                      </Link>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(record.id)}
                  disabled={deletingId === record.id}
                  className="text-red-600 underline hover:text-red-800 disabled:opacity-50"
                >
                  {deletingId === record.id
                    ? t("mySubmissions.deleting")
                    : t("mySubmissions.delete")}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
