export const HOME_FILTERS_KEY = "yeji-outfits-home-filters";

export type HomeFiltersState = {
  typeFilter: string;
  query: string;
};

export function getSavedFilters(): HomeFiltersState {
  try {
    const raw = sessionStorage.getItem(HOME_FILTERS_KEY);
    if (!raw) return { typeFilter: "", query: "" };
    const parsed = JSON.parse(raw) as Partial<HomeFiltersState>;
    return {
      typeFilter: typeof parsed.typeFilter === "string" ? parsed.typeFilter : "",
      query: typeof parsed.query === "string" ? parsed.query : "",
    };
  } catch {
    return { typeFilter: "", query: "" };
  }
}

export function setSavedFilters(filters: HomeFiltersState): void {
  sessionStorage.setItem(HOME_FILTERS_KEY, JSON.stringify(filters));
}
