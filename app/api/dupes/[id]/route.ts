import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { deleteCatalogDupe, listCatalogDupes } from "@/lib/catalog-dupe";
import { resolveVoterKey } from "@/lib/dupe-actor";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const removed = await deleteCatalogDupe(id);
    if (!removed) {
      return NextResponse.json({ error: "找不到平替" }, { status: 404 });
    }

    const { deleteUploadIfOrphaned } = await import("@/lib/delete-upload");
    await deleteUploadIfOrphaned(removed.image);

    const user = await getCurrentUser();
    const voterKey = resolveVoterKey(request, user?.id);
    const dupes = await listCatalogDupes(removed.catalogItemId, voterKey);

    return NextResponse.json({ ok: true, dupes });
  } catch {
    return NextResponse.json({ error: "刪除失敗" }, { status: 500 });
  }
}
