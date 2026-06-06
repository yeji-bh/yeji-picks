import { normalizeItemType } from "@/lib/types";

export function catalogFingerprint(item: {
  type: string;
  brand?: string | null;
  productName?: string | null;
}): string {
  const type = normalizeItemType(item.type);
  const brand = (item.brand ?? "").trim().toLowerCase();
  const name = (item.productName ?? "").trim().toLowerCase();
  return `${type}::${brand}::${name}`;
}
