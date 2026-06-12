"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import SubmitForm from "@/components/SubmitForm";

function SubmitPageContent() {
  const { t } = useTranslation();

  return (
    <div className="min-w-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          {t("submit.title")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("submit.desc")}</p>
        <Link
          href="/my-submissions"
          className="mt-2 inline-block text-sm text-foreground-secondary underline hover:text-foreground"
        >
          {t("mySubmissions.viewHistory")}
        </Link>
      </div>
      <SubmitForm />
    </div>
  );
}

export default function SubmitPage() {
  const { t } = useTranslation();

  return (
    <Suspense fallback={<p className="text-sm text-muted">{t("loading")}</p>}>
      <SubmitPageContent />
    </Suspense>
  );
}
