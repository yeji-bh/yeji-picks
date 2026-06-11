import "server-only";

import { revalidatePath } from "next/cache";

export function revalidateOutfitCaches(outfitId?: string) {
  try {
    revalidatePath("/");
    revalidatePath("/outfit/[id]", "page");
    revalidatePath("/item/[id]", "page");
    revalidatePath("/brand/[slug]", "page");
    revalidatePath("/favorites");
    if (outfitId) {
      revalidatePath(`/outfit/${outfitId}`);
    }
  } catch (err) {
    // On Cloudflare without D1/R2 ISR setup, on-demand revalidation can throw.
    // Content updates take effect after the next deploy.
    console.warn("[revalidateOutfitCaches]", err);
  }
}
