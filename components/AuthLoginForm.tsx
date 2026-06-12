"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/AuthProvider";
import { clearBrowserDataAfterSync } from "@/lib/clear-browser-data";
import { getFavoriteStore } from "@/lib/favorites";
import { getSubmissionIds } from "@/lib/submissions";

export default function AuthLoginForm({
  onSuccess,
  showRegisterLink = true,
}: {
  onSuccess?: () => void;
  showRegisterLink?: boolean;
}) {
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
      const res = await fetch("/api/auth/login", {
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
      if (!res.ok) throw new Error(data.error ?? t("auth.loginFail"));

      clearBrowserDataAfterSync();
      await refresh();
      onSuccess?.();
      router.push("/my-submissions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginFail"));
    } finally {
      setLoading(false);
    }
  }

  return (
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
          className="ui-field mt-1 px-3 py-2.5 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-xs text-muted">{t("auth.password")}</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="ui-field mt-1 px-3 py-2.5 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="ui-btn-primary w-full px-4 py-2.5 text-sm"
      >
        {loading ? t("loading") : t("auth.login")}
      </button>
      {showRegisterLink && (
        <p className="text-center text-sm text-muted">
          {t("auth.noAccount")}{" "}
          <Link
            href="/register"
            className="text-foreground underline hover:text-foreground-secondary"
          >
            {t("auth.register")}
          </Link>
        </p>
      )}
    </form>
  );
}
