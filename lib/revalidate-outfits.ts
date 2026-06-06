import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateOutfitCaches(outfitId?: string) {
  revalidateTag("outfits");
  revalidatePath("/");
  revalidatePath("/favorites");
  if (outfitId) {
    revalidatePath(`/outfit/${outfitId}`);
  }
}
