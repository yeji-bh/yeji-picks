"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import AuthLoginForm from "@/components/AuthLoginForm";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div className="py-16 text-center text-sm text-muted">{t("loading")}</div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm py-6 sm:py-10">
      <h1 className="text-xl font-semibold text-foreground">{t("auth.login")}</h1>
      <p className="mt-1.5 text-sm text-muted">{t("auth.loginDesc")}</p>
      <div className="mt-6">
        <AuthLoginForm showRegisterLink />
      </div>
    </div>
  );
}
