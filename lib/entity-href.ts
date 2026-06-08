import { formatOutfitTitle } from "@/lib/outfit";
import { withIdSlug } from "@/lib/slug";

export function itemHref(input: {
  id: string;
  productName?: string | null;
  brand?: string | null;
  type?: string | null;
}): string {
  const label = input.productName?.trim() || input.brand?.trim() || input.type?.trim() || "item";
  return `/item/${withIdSlug(input.id, label)}`;
}

export function outfitHref(input: {
  id: string;
  date?: string | null;
  eventName?: string | null;
}): string {
  const label = formatOutfitTitle(input.date ?? "", input.eventName ?? "");
  return `/outfit/${withIdSlug(input.id, label)}`;
}
