import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateOutfitCaches(outfitId?: string) {
  revalidateTag("outfits");
  revalidatePath("/");
  revalidatePath("/favorites");
  revalidatePath("/item", "layout");
  revalidatePath("/brand", "layout");
  if (outfitId) {
    revalidatePath(`/outfit/${outfitId}`);
  }
}
