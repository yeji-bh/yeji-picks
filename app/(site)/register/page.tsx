"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import AuthRegisterForm from "@/components/AuthRegisterForm";
import { useAuth } from "@/components/AuthProvider";

export default function RegisterPage() {
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
      <h1 className="text-xl font-semibold text-foreground">{t("auth.register")}</h1>
      <p className="mt-1.5 text-sm text-muted">{t("auth.registerDesc")}</p>
      <div className="mt-6">
        <AuthRegisterForm
          onSuccess={() => {
            router.push("/my-submissions");
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
