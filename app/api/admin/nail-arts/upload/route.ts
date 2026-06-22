import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { rollbackFreshUploads } from "@/lib/delete-upload";
import { prisma } from "@/lib/db";

const MAX_FILES = 50;

export async function POST(request: NextRequest) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const uploadedUrls: string[] = [];

  try {
    const formData = await request.formData();
    const { saveUploadedFile } = await import("@/lib/upload");
    const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
    const thumbs = formData
      .getAll("thumbs")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (files.length === 0) {
      return apiError(request, "api.errors.selectImage", 400);
    }
    if (files.length > MAX_FILES) {
      return apiError(request, "api.errors.invalidParams", 400);
    }

    for (let index = 0; index < files.length; index += 1) {
      uploadedUrls.push(
        await saveUploadedFile(files[index], "item", {
          thumbFile: thumbs[index],
        })
      );
    }

    const nailArts = await prisma.$transaction(
      uploadedUrls.map((image) =>
        prisma.nailArt.create({
          data: { image },
          select: { id: true, image: true, createdAt: true },
        })
      )
    );

    return NextResponse.json(
      { nailArts, count: nailArts.length },
      { status: 201 }
    );
  } catch (err) {
    if (uploadedUrls.length > 0) {
      await rollbackFreshUploads(uploadedUrls);
    }
    console.error("[admin nail-arts upload POST]", err);
    return apiError(request, "api.errors.operationFailed", 500);
  }
}
