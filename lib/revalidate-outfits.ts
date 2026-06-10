import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateOutfitCaches(outfitId?: string) {
  revalidateTag("outfits");
  revalidatePath("/");
  revalidatePath("/outfit/[id]", "page");
  revalidatePath("/item/[id]", "page");
  revalidatePath("/brand/[slug]", "page");
  revalidatePath("/favorites");
  if (outfitId) {
    revalidatePath(`/outfit/${outfitId}`);
  }
}
