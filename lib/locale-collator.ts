import type { Locale } from "@/lib/i18n/settings";

/** BCP 47 locale for Intl.Collator */
export function collatorLocale(locale: Locale): string {
  switch (locale) {
    case "zh-CN":
      return "zh-Hans";
    case "zh-TW":
      return "zh-Hant";
    case "ko":
      return "ko";
    case "en":
    default:
      return "en";
  }
}

export function createLocaleCollator(locale: Locale): Intl.Collator {
  return new Intl.Collator(collatorLocale(locale), {
    usage: "sort",
    sensitivity: "base",
    numeric: true,
  });
}

/** Lexicographic compare: first char, then second, … across each field in order. */
export function compareLocaleFields(
  locale: Locale,
  direction: "asc" | "desc",
  fieldsA: string[],
  fieldsB: string[]
): number {
  const collator = createLocaleCollator(locale);
  const factor = direction === "asc" ? 1 : -1;
  const len = Math.max(fieldsA.length, fieldsB.length);
  for (let i = 0; i < len; i++) {
    const diff = collator.compare(
      (fieldsA[i] ?? "").trim(),
      (fieldsB[i] ?? "").trim()
    );
    if (diff !== 0) return diff * factor;
  }
  return 0;
}

export function compareLocaleStrings(
  a: string,
  b: string,
  locale: Locale,
  direction: "asc" | "desc"
): number {
  return compareLocaleFields(locale, direction, [a], [b]);
}
