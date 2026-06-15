import type { Locale } from "@/lib/i18n/settings";

/** One webfont family per locale — avoids Inter + Noto loading together on CJK pages. */
export async function localeFontBodyClass(locale: Locale): Promise<string> {
  switch (locale) {
    case "zh-CN": {
      const { notoSansSC } = await import("@/lib/fonts/noto-sc");
      return notoSansSC.variable;
    }
    case "zh-TW": {
      const { notoSansTC } = await import("@/lib/fonts/noto-tc");
      return notoSansTC.variable;
    }
    case "ko": {
      const { notoSansKR } = await import("@/lib/fonts/noto-kr");
      return notoSansKR.variable;
    }
    default: {
      const { inter } = await import("@/lib/fonts/inter");
      return inter.variable;
    }
  }
}
