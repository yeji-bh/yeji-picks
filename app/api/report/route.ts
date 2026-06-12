import { NextRequest, NextResponse } from "next/server";
import { apiError, moderationError } from "@/lib/api-error";
import { moderateText } from "@/lib/content-moderation";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { outfitId, itemId, message } = await request.json();

    if (
      typeof outfitId !== "string" ||
      !outfitId ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return apiError(request, "api.errors.invalidPayload", 400);
    }

    const textCheck = moderateText(message, "report");
    if (!textCheck.ok) {
      return moderationError(request, textCheck.field, textCheck.code);
    }

    const outfit = await prisma.outfit.findUnique({
      where: { id: outfitId },
    });

    if (!outfit) {
      return apiError(request, "api.errors.notFoundOutfit", 404);
    }

    if (itemId) {
      if (typeof itemId !== "string") {
        return apiError(request, "api.errors.invalidPayload", 400);
      }
      const placement = await prisma.outfitItem.findFirst({
        where: { outfitId, catalogItemId: itemId },
      });
      if (!placement) {
        return apiError(request, "api.errors.notFoundItem", 404);
      }
    }

    const report = await prisma.report.create({
      data: {
        outfitId,
        catalogItemId: typeof itemId === "string" && itemId ? itemId : null,
        message: message.trim(),
        status: "pending",
      },
    });

    return NextResponse.json({ id: report.id });
  } catch {
    return apiError(request, "api.errors.submitFailed", 500);
  }
}
