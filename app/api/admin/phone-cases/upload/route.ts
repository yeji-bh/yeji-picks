import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { rollbackFreshUploads } from "@/lib/delete-upload";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  let imageUrl: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const brandRaw = formData.get("brand");
    const modelRaw = formData.get("model");
    const officialLinkRaw = formData.get("officialLink");
    const brand = typeof brandRaw === "string" ? brandRaw.trim() : "";
    const model = typeof modelRaw === "string" ? modelRaw.trim() : "";
    const officialLink =
      typeof officialLinkRaw === "string" ? officialLinkRaw.trim() : "";

    if (!file || !(file instanceof File)) {
      return apiError(request, "api.errors.selectImage", 400);
    }
    if (!brand || !model) {
      return apiError(request, "api.errors.invalidParams", 400);
    }
    if (!officialLink) {
      return apiError(request, "api.errors.enterLink", 400);
    }

    const { saveUploadedFile } = await import("@/lib/upload");
    imageUrl = await saveUploadedFile(file, "item");

    const row = await prisma.phoneCase.create({
      data: { image: imageUrl, brand, model, officialLink },
      select: {
        id: true,
        image: true,
        brand: true,
        model: true,
        officialLink: true,
        createdAt: true,
      },
    });

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    if (imageUrl) {
      await rollbackFreshUploads([imageUrl]);
    }
    console.error("[admin phone-cases upload POST]", err);
    return apiError(request, "api.errors.operationFailed", 500);
  }
}
