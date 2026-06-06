/** Normalized key for case-insensitive brand matching. */
export function brandKey(brand: string): string {
  return brand.trim().toLowerCase();
}

export function brandSlug(brand: string): string {
  return encodeURIComponent(brandKey(brand));
}

export function parseBrandSlug(slug: string): string {
  return brandKey(decodeURIComponent(slug));
}

export function brandHref(brand: string): string {
  return `/brand/${brandSlug(brand)}`;
}

/** Prefer the spelling that appears most often in the database. */
export function pickCanonicalBrand(names: Iterable<string>): string {
  const counts = new Map<string, number>();
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  }
  if (counts.size === 0) return "";
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  )[0][0];
}

export function dedupeBrandsByKey(brands: string[]): string[] {
  const byKey = new Map<string, string[]>();
  for (const name of brands) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const key = brandKey(trimmed);
    const list = byKey.get(key) ?? [];
    list.push(trimmed);
    byKey.set(key, list);
  }
  return [...byKey.values()]
    .map(pickCanonicalBrand)
    .sort((a, b) => a.localeCompare(b));
}
