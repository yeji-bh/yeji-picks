import type { AuthUser } from "@/lib/auth";

type SubmissionRow = {
  id: string;
  userId: string | null;
  status: string;
};

export function canManageSubmission(
  submission: SubmissionRow,
  user: AuthUser | null,
  localIds: string[]
): boolean {
  if (user?.role === "admin") return true;
  if (submission.userId && user && submission.userId === user.id) return true;
  if (!submission.userId && localIds.includes(submission.id)) return true;
  return false;
}
