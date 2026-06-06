import { prisma } from "@/lib/db";
import { revalidateOutfitCaches } from "@/lib/revalidate-outfits";
import type { SubmissionPayload } from "@/lib/types";

export async function approveSubmission(
  submissionId: string,
  userId?: string | null
) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw new Error("找不到投稿");
  }

  if (submission.status !== "pending") {
    throw new Error("此投稿已處理");
  }

  const data = JSON.parse(submission.rawJson) as SubmissionPayload;

  const outfit = await prisma.$transaction(async (tx) => {
    const created = await tx.outfit.create({
      data: {
        eventName: data.eventName,
        date: data.date,
        mainImage: data.mainImage,
        userId: userId ?? submission.userId ?? null,
      },
    });

    if (data.items.length > 0) {
      await tx.item.createMany({
        data: data.items.map((item) => ({
          outfitId: created.id,
          type: item.type,
          brand: item.brand || null,
          productName: item.productName || null,
          image: item.image || null,
          officialLink: item.officialLink || null,
          notes: item.notes || null,
        })),
      });
    }

    await tx.submission.update({
      where: { id: submissionId },
      data: { status: "approved", outfitId: created.id },
    });

    return created;
  });

  revalidateOutfitCaches(outfit.id);

  return outfit;
}
