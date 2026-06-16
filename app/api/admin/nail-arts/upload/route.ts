import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { rollbackFreshUploads } from "@/lib/delete-upload";
import { prisma } from "@/lib/db";

const MAX_FILES = 50;

function collectFiles(formData: FormData): File[] {
  const files: File[] = [];
  for (const value of formData.values()) {
    if (value instanceof File && value.size > 0) {
      files.push(value);
    }
  }
  return files;
}

export async function POST(request: NextRequest) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const uploadedUrls: string[] = [];

  try {
    const formData = await request.formData();
    const files = collectFiles(formData);

    if (files.length === 0) {
      return apiError(request, "api.errors.selectImage", 400);
    }
    if (files.length > MAX_FILES) {
      return apiError(request, "api.errors.invalidParams", 400);
    }

    const { saveUploadedFile } = await import("@/lib/upload");
    for (const file of files) {
      uploadedUrls.push(await saveUploadedFile(file, "item"));
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
