import type { Locale } from "@/lib/i18n/settings";

/** English uses Inter; CJK locales rely on system fonts (no webfont download on mobile). */
export async function localeFontBodyClass(locale: Locale): Promise<string> {
  if (locale === "en") {
    const { inter } = await import("@/lib/fonts/inter");
    return inter.variable;
  }
  return "";
}
