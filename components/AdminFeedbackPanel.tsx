"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { assetUrl } from "@/lib/asset-url";
import ReportTarget from "./ReportTarget";

type SiteFeedbackRow = {
  id: string;
  category: string;
  message: string;
  image: string | null;
  status: string;
  createdAt: string;
  userAccount: string | null;
};

type ReportRow = {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  outfitId: string;
  itemId: string | null;
  outfitTitle: string;
  itemType: string | null;
  itemBrand: string | null;
  itemProductName: string | null;
};

export default function AdminFeedbackPanel() {
  const { t } = useTranslation();
  const [siteFeedback, setSiteFeedback] = useState<SiteFeedbackRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/feedback");
        const data = await res.json();
        if (res.ok) {
          setSiteFeedback(data.siteFeedback ?? []);
          setReports(data.reports ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleResolveFeedback(id: string) {
    setResolvingId(id);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, { method: "PATCH" });
      if (res.ok) {
        setSiteFeedback((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "resolved" } : r))
        );
      }
    } finally {
      setResolvingId(null);
    }
  }

  async function handleResolveReport(id: string) {
    setResolvingReportId(id);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, { method: "PATCH" });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "resolved" } : r))
        );
      }
    } finally {
      setResolvingReportId(null);
    }
  }

  const pendingSite = siteFeedback.filter((r) => r.status === "pending");
  const pendingReports = reports.filter((r) => r.status === "pending");

  return (
    <div className="min-w-0">
      <h1 className="text-xl font-semibold text-neutral-900 sm:text-2xl">
        {t("feedback.adminTitle")}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {t("feedback.adminDescCombined", {
          site: pendingSite.length,
          reports: pendingReports.length,
        })}
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-muted">{t("loading")}</p>
      ) : (
        <div className="mt-8 space-y-10">
          <section>
            <h2 className="text-lg font-semibold text-neutral-900">
              {t("feedback.siteSection")}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {t("feedback.siteSectionDesc", { count: pendingSite.length })}
            </p>
            {siteFeedback.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                {t("feedback.adminEmpty")}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {siteFeedback.map((row) => (
                  <article
                    key={row.id}
                    className="rounded-xl border border-border bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-xs text-muted">
                        {new Date(row.createdAt).toLocaleString()}
                        {row.userAccount && ` · ${row.userAccount}`}
                      </p>
                      <StatusBadge status={row.status} />
                    </div>
                    <div className="mt-2 rounded-lg border border-border bg-neutral-50 px-3 py-2 text-sm">
                      <p className="text-xs font-medium text-muted">
                        {t("feedback.siteTarget")}
                      </p>
                      <p className="mt-1 font-medium text-neutral-900">
                        {t(`feedback.category.${row.category}`, {
                          defaultValue: t("feedback.siteTargetDesc"),
                        })}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-neutral-900">
                      {row.message}
                    </p>
                    {row.image && (
                      <a
                        href={assetUrl(row.image)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block"
                      >
                        <img
                          src={assetUrl(row.image)}
                          alt=""
                          className="max-h-40 rounded-lg border border-border object-contain"
                        />
                      </a>
                    )}
                    {row.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => handleResolveFeedback(row.id)}
                        disabled={resolvingId === row.id}
                        className="mt-3 text-xs text-neutral-700 underline hover:text-neutral-900 disabled:opacity-50"
                      >
                        {resolvingId === row.id
                          ? t("feedback.resolving")
                          : t("feedback.resolve")}
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">
              {t("feedback.reportSection")}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {t("feedback.reportSectionDesc", {
                count: pendingReports.length,
              })}
            </p>
            {reports.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                {t("feedback.reportEmpty")}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {reports.map((row) => (
                  <article
                    key={row.id}
                    className="rounded-xl border border-border bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-xs text-muted">
                        {new Date(row.createdAt).toLocaleString()}
                      </p>
                      <StatusBadge status={row.status} />
                    </div>
                    <div className="mt-2">
                      <ReportTarget
                        kind={row.itemId ? "item" : "outfit"}
                        outfitTitle={row.outfitTitle}
                        itemType={row.itemType ?? undefined}
                        itemBrand={row.itemBrand}
                        itemProductName={row.itemProductName}
                      />
                      <Link
                        href={`/outfit/${row.outfitId}`}
                        className="mt-2 inline-block text-xs text-neutral-600 underline hover:text-neutral-900"
                      >
                        {t("feedback.viewOutfit")}
                      </Link>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-neutral-900">
                      {row.message}
                    </p>
                    {row.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => handleResolveReport(row.id)}
                        disabled={resolvingReportId === row.id}
                        className="mt-3 text-xs text-neutral-700 underline hover:text-neutral-900 disabled:opacity-50"
                      >
                        {resolvingReportId === row.id
                          ? t("feedback.resolving")
                          : t("feedback.resolve")}
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        status === "pending"
          ? "bg-amber-100 text-amber-800"
          : "bg-green-100 text-green-800"
      }`}
    >
      {status === "pending"
        ? t("feedback.statusPending")
        : t("feedback.statusResolved")}
    </span>
  );
}
