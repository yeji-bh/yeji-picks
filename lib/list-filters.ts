import { matchesTypeFilter } from "@/lib/types";

export function matchesListQuery(searchText: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = searchText.toLowerCase();
  if (haystack.includes(q)) return true;

  // Dates are often stored as 2026-02-27; allow digit-only fragments like 2602.
  const qDigits = q.replace(/\D/g, "");
  if (qDigits.length < 2) return false;
  return searchText.replace(/\D/g, "").includes(qDigits);
}

export function matchesOutfitFilters(
  outfit: { itemTypes: string[]; searchText: string },
  typeFilter: string,
  query: string
): boolean {
  if (
    typeFilter &&
    !outfit.itemTypes.some((type) => matchesTypeFilter(type, typeFilter))
  ) {
    return false;
  }
  return matchesListQuery(outfit.searchText, query);
}

export function matchesItemFilters(
  item: { type: string; searchText: string },
  typeFilter: string,
  query: string
): boolean {
  if (typeFilter && !matchesTypeFilter(item.type, typeFilter)) {
    return false;
  }
  return matchesListQuery(item.searchText, query);
}

export function matchesPhoneCaseQuery(
  phoneCase: { searchText: string },
  query: string
): boolean {
  return matchesListQuery(phoneCase.searchText, query);
}

export function matchesPerfumeQuery(
  perfume: { searchText: string },
  query: string
): boolean {
  return matchesListQuery(perfume.searchText, query);
}
