import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { deleteCatalogDupe, listCatalogDupes } from "@/lib/catalog-dupe";
import { resolveVoterKey } from "@/lib/dupe-actor";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminUser())) {
    return apiError(request, "api.errors.unauthorized", 401);
  }

  const { id } = await params;

  try {
    const removed = await deleteCatalogDupe(id);
    if (!removed) {
      return apiError(request, "api.errors.notFoundDupe", 404);
    }

    const { deleteUploadIfUnreferencedInDb } = await import(
      "@/lib/delete-upload"
    );
    await deleteUploadIfUnreferencedInDb(removed.image);

    const user = await getCurrentUser();
    const voterKey = resolveVoterKey(request, user?.id);
    const dupes = await listCatalogDupes(removed.catalogItemId, voterKey);

    return NextResponse.json({ ok: true, dupes });
  } catch {
    return apiError(request, "api.errors.deleteFailed", 500);
  }
}
