import { redirect } from "next/navigation";
import { Suspense } from "react";
import SubmissionsPanel, {
  type SubmissionRecord,
} from "@/components/SubmissionsPanel";
import type { AdminSubmission } from "@/components/AdminPanel";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SubmissionPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["pending", "approved", "rejected"] as const;

function mapSubmission(sub: {
  id: string;
  status: string;
  outfitId: string | null;
  createdAt: Date;
  rawJson: string;
}): SubmissionRecord | null {
  try {
    return {
      id: sub.id,
      status: sub.status as SubmissionRecord["status"],
      outfitId: sub.outfitId,
      createdAt: sub.createdAt.toISOString(),
      payload: JSON.parse(sub.rawJson) as SubmissionPayload,
    };
  } catch {
    return null;
  }
}

export default async function MySubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";
  const { status: rawStatus } = await searchParams;

  if (isAdmin) {
    const status =
      rawStatus && VALID_STATUSES.includes(rawStatus as (typeof VALID_STATUSES)[number])
        ? rawStatus
        : "pending";

    if (!rawStatus || rawStatus !== status) {
      redirect(`/my-submissions?status=${status}`);
    }

    const [rows, pendingTotal] = await Promise.all([
      prisma.submission.findMany({
        where: { status },
        orderBy: { createdAt: "desc" },
      }),
      prisma.submission.count({ where: { status: "pending" } }),
    ]);

    const submissions: AdminSubmission[] = rows
      .map((sub) => {
        const data = mapSubmission(sub);
        if (!data) return null;
        return {
          id: data.id,
          status: data.status,
          outfitId: data.outfitId,
          createdAt: data.createdAt,
          data: data.payload,
        };
      })
      .filter(Boolean) as AdminSubmission[];

    return (
      <Suspense fallback={<p className="text-sm text-muted">...</p>}>
        <SubmissionsPanel
          isAdmin
          submissions={submissions}
          pendingTotal={pendingTotal}
        />
      </Suspense>
    );
  }

  let initialRecords: SubmissionRecord[] = [];

  if (user) {
    const rows = await prisma.submission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    initialRecords = rows
      .map(mapSubmission)
      .filter((r): r is SubmissionRecord => Boolean(r));
  }

  return (
    <Suspense fallback={<p className="text-sm text-muted">...</p>}>
      <SubmissionsPanel isAdmin={false} initialRecords={initialRecords} />
    </Suspense>
  );
}
