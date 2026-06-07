"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import AdminPanel, { type AdminSubmission } from "./AdminPanel";
import MySubmissions from "./MySubmissions";
import type { SubmissionPayload, SubmissionStatus } from "@/lib/types";

export type SubmissionRecord = {
  id: string;
  status: SubmissionStatus;
  outfitId?: string | null;
  createdAt: string;
  payload: SubmissionPayload;
};

export default function SubmissionsPanel({
  isAdmin,
  submissions = [],
  pendingTotal = 0,
  initialRecords = [],
}: {
  isAdmin: boolean;
  submissions?: AdminSubmission[];
  pendingTotal?: number;
  initialRecords?: SubmissionRecord[];
}) {
  const { t } = useTranslation();

  if (isAdmin) {
    return (
      <div className="min-w-0">
        <AdminPanel submissions={submissions} pendingTotal={pendingTotal} />
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-semibold text-neutral-900 sm:text-2xl">
          {t("mySubmissions.title")}
        </h1>
      </div>
      <MySubmissions initialRecords={initialRecords} />
    </div>
  );
}
