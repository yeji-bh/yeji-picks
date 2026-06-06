"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AutoTranslate from "./AutoTranslate";

type DeadLink = {
  itemId: string;
  outfitId: string;
  outfitTitle: string;
  brand: string | null;
  productName: string | null;
  officialLink: string | null;
  linkCheckedAt: string | null;
};

export default function AdminLinkChecker() {
  const { t } = useTranslation();
  const [deadLinks, setDeadLinks] = useState<DeadLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function loadDeadLinks() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/check-links");
      const data = await res.json();
      if (res.ok) setDeadLinks(data.deadLinks ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function runCheck() {
    setChecking(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/admin/check-links", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("admin.linkCheckFail"));
      setDeadLinks(data.deadLinks ?? []);
      setLastResult(
        t("admin.linkCheckResult", {
          checked: data.checked,
          dead: data.dead,
        })
      );
    } catch (err) {
      setLastResult(
        err instanceof Error ? err.message : t("admin.linkCheckFail")
      );
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    loadDeadLinks();
  }, []);

  return (
    <section className="mt-4 rounded-xl border border-border bg-white p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            {t("admin.linkCheckTitle")}
          </h2>
          <p className="mt-1 text-xs text-muted">{t("admin.linkCheckDesc")}</p>
        </div>
        <button
          type="button"
          onClick={runCheck}
          disabled={checking}
          className="shrink-0 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
        >
          {checking ? t("admin.linkCheckRunning") : t("admin.linkCheckRun")}
        </button>
      </div>

      {lastResult && (
        <p className="mb-3 text-sm text-neutral-600">{lastResult}</p>
      )}

      {loading ? (
        <p className="text-sm text-muted">{t("admin.linkCheckLoading")}</p>
      ) : deadLinks.length === 0 ? (
        <p className="text-sm text-green-600">{t("admin.linkCheckNone")}</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-red-600">
            {t("admin.linkCheckDead", { count: deadLinks.length })}
          </p>
          {deadLinks.map((link) => (
            <div
              key={link.itemId}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm"
            >
              <Link
                href={`/outfit/${link.outfitId}`}
                className="font-medium text-neutral-900 underline"
              >
                <span>
                  <AutoTranslate text={link.outfitTitle} />
                </span>
              </Link>
              <p className="text-xs text-neutral-600">
                {link.brand && <AutoTranslate text={link.brand} />}
                {link.brand && link.productName && " · "}
                {link.productName && <AutoTranslate text={link.productName} />}
              </p>
              {link.officialLink && (
                <p className="mt-1 truncate text-xs text-red-700">
                  {link.officialLink}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
