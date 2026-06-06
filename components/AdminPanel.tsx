"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AdminSubmissionCard from "./AdminSubmissionCard";
import type { SubmissionPayload } from "@/lib/types";

const AdminLinkChecker = dynamic(() => import("./AdminLinkChecker"), {
  ssr: false,
  loading: () => null,
});

export type AdminSubmission = {
  id: string;
  status: string;
  outfitId?: string | null;
  createdAt: string;
  data: SubmissionPayload;
};

const FILTERS = [
  { key: "pending", labelKey: "admin.filterPending" },
  { key: "approved", labelKey: "admin.filterApproved" },
  { key: "rejected", labelKey: "admin.filterRejected" },
] as const;

export default function AdminPanel({
  submissions,
  pendingTotal,
}: {
  submissions: AdminSubmission[];
  pendingTotal: number;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "pending";
  const [linkCheckerOpen, setLinkCheckerOpen] = useState(false);

  function setFilter(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", key);
    router.push(`/my-submissions?${params}`);
  }

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 sm:text-2xl">
            {t("admin.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t("admin.total", { count: submissions.length })}
            {pendingTotal > 0 &&
              ` · ${t("admin.pending", { count: pendingTotal })}`}
          </p>
          <p className="mt-1 text-xs text-neutral-400">{t("admin.hint")}</p>
        </div>
        {/* <Link
          href="/"
          className="shrink-0 text-sm text-muted hover:text-neutral-900"
        >
          {t("outfit.backHome")}
        </Link> */}
      </div>

      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 sm:mb-6 sm:flex-wrap sm:overflow-visible">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              statusFilter === f.key
                ? "bg-neutral-900 text-white"
                : "border border-border bg-white text-neutral-600"
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {submissions.length === 0 ? (
        <p className="text-sm text-muted">{t("admin.noSubmissions")}</p>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <AdminSubmissionCard
              key={sub.id}
              id={sub.id}
              status={sub.status}
              outfitId={sub.outfitId}
              createdAt={sub.createdAt}
              data={sub.data}
            />
          ))}
        </div>
      )}

      <div className="mt-10">
        <button
          type="button"
          onClick={() => setLinkCheckerOpen((v) => !v)}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          {linkCheckerOpen ? "▾" : "▸"} {t("admin.linkCheckTitle")}
        </button>
        {linkCheckerOpen && <AdminLinkChecker />}
      </div>
    </div>
  );
}
