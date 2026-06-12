import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { approveSubmission } from "@/lib/approve-submission";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const { id } = await params;

  try {
    const { action } = await request.json();

    if (action !== "approve" && action !== "reject") {
      return apiError(request, "api.errors.invalidAction", 400);
    }

    const submission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      return apiError(request, "api.errors.notFoundSubmission", 404);
    }

    if (submission.status !== "pending") {
      return apiError(request, "api.errors.submissionProcessed", 400);
    }

    if (action === "reject") {
      await prisma.submission.update({
        where: { id },
        data: { status: "rejected" },
      });
      return NextResponse.json({ status: "rejected" });
    }

    const outfit = await approveSubmission(id, submission.userId);

    return NextResponse.json({ status: "approved", outfitId: outfit.id });
  } catch {
    return apiError(request, "api.errors.operationFailed", 500);
  }
}
