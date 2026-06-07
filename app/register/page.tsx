"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/AuthProvider";
import { clearBrowserDataAfterSync } from "@/lib/clear-browser-data";
import { getFavoriteStore } from "@/lib/favorites";
import { getSubmissionIds } from "@/lib/submissions";

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { refresh } = useAuth();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account,
          password,
          submissionIds: getSubmissionIds(),
          favorites: getFavoriteStore(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("auth.registerFail"));

      clearBrowserDataAfterSync();
      await refresh();
      router.push("/my-submissions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.registerFail"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm min-w-0">
      <h1 className="mb-2 text-xl font-semibold">{t("auth.register")}</h1>
      <p className="mb-6 text-sm text-muted">{t("auth.registerDesc")}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <label className="block">
          <span className="text-xs text-muted">{t("auth.account")}</span>
          <input
            type="text"
            required
            autoComplete="username"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">{t("auth.password")}</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? t("loading") : t("auth.register")}
        </button>
        <p className="text-center text-sm text-muted">
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="text-neutral-900 underline hover:text-neutral-600">
            {t("auth.login")}
          </Link>
        </p>
      </form>
    </div>
  );
}
