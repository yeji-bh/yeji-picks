"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AdminSubmissionInlineEdit from "./AdminSubmissionInlineEdit";
import { COVER_ASPECT_CLASS } from "@/lib/image";
import { formatOutfitTitle } from "@/lib/outfit";
import type { SubmissionPayload } from "@/lib/types";

type Props = {
  id: string;
  status: string;
  outfitId?: string | null;
  createdAt: string;
  data: SubmissionPayload;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminSubmissionCard({
  id,
  status,
  outfitId,
  createdAt,
  data,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = formatOutfitTitle(data.date, data.eventName);
  const displayTitle = title === "outfit" ? t("outfit.unnamed") : title;

  const statusLabel =
    status === "approved"
      ? t("admin.statusApproved")
      : status === "rejected"
        ? t("admin.statusRejected")
        : t("admin.filterPending");

  async function handleAction(action: "approve" | "reject") {
    setLoading(action);
    setError(null);

    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? t("admin.processing"));

      if (action === "approve") {
        router.push("/");
        router.refresh();
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.processing"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <article className="rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-neutral-900">
            {displayTitle}
          </p>
          <p className="mt-1 text-xs text-muted">
            {new Date(createdAt).toLocaleString()}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            STATUS_COLORS[status] ?? "bg-neutral-100"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
        {data.mainImage && (
          <div
            className={`relative overflow-hidden rounded-lg bg-neutral-100 ${COVER_ASPECT_CLASS}`}
          >
            <Image
              src={data.mainImage}
              alt={displayTitle}
              fill
              className="object-cover"
              sizes="140px"
            />
          </div>
        )}

        <div className="min-w-0">
          <AdminSubmissionInlineEdit submissionId={id} data={data} />
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <div className="mb-3 flex flex-wrap gap-3 text-sm">
          <Link
            href={
              status === "approved" && outfitId
                ? `/outfit/${outfitId}/edit`
                : `/submit?edit=${id}`
            }
            className="text-neutral-700 underline hover:text-neutral-900"
          >
            {t("admin.editImages")}
          </Link>
          {status === "approved" && outfitId && (
            <Link
              href={`/outfit/${outfitId}`}
              className="text-neutral-700 underline hover:text-neutral-900"
            >
              {t("admin.viewOutfit")}
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "pending" && (
            <>
              <button
                type="button"
                onClick={() => handleAction("approve")}
                disabled={loading !== null}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading === "approve"
                  ? t("admin.processing")
                  : t("admin.approve")}
              </button>
              <button
                type="button"
                onClick={() => handleAction("reject")}
                disabled={loading !== null}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
              >
                {loading === "reject"
                  ? t("admin.processing")
                  : t("admin.reject")}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
