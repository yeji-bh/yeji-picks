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
    const nameRaw = formData.get("name");
    const brandRaw = formData.get("brand");
    const descriptionRaw = formData.get("description");
    const officialLinkRaw = formData.get("officialLink");
    const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
    const brand = typeof brandRaw === "string" ? brandRaw.trim() : "";
    const description =
      typeof descriptionRaw === "string" ? descriptionRaw.trim() : "";
    const officialLink =
      typeof officialLinkRaw === "string" ? officialLinkRaw.trim() : "";

    if (!file || !(file instanceof File)) {
      return apiError(request, "api.errors.selectImage", 400);
    }
    if (!name || !brand) {
      return apiError(request, "api.errors.invalidParams", 400);
    }
    if (!officialLink) {
      return apiError(request, "api.errors.enterLink", 400);
    }

    const { saveUploadedFile } = await import("@/lib/upload");
    imageUrl = await saveUploadedFile(file, "item");

    const row = await prisma.perfume.create({
      data: { image: imageUrl, name, brand, description, officialLink },
      select: {
        id: true,
        image: true,
        name: true,
        brand: true,
        description: true,
        officialLink: true,
        createdAt: true,
      },
    });

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    if (imageUrl) {
      await rollbackFreshUploads([imageUrl]);
    }
    console.error("[admin perfumes upload POST]", err);
    return apiError(request, "api.errors.operationFailed", 500);
  }
}
