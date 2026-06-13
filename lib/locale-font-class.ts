import { inter } from "@/lib/fonts";
import type { Locale } from "@/lib/i18n/settings";

/** Load only the Noto variant needed for the active locale (avoids dual woff2 waterfall). */
export async function localeFontBodyClass(locale: Locale): Promise<string> {
  const classes = [inter.variable];

  if (locale === "zh-CN") {
    const { notoSansSC } = await import("@/lib/fonts/noto-sc");
    classes.push(notoSansSC.variable);
  } else if (locale === "zh-TW") {
    const { notoSansTC } = await import("@/lib/fonts/noto-tc");
    classes.push(notoSansTC.variable);
  }

  return classes.join(" ");
}
