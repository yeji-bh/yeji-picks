import { matchesTypeFilter } from "@/lib/types";

export function matchesListQuery(searchText: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return searchText.toLowerCase().includes(q);
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
