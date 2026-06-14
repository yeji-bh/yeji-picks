import { Noto_Sans_TC } from "next/font/google";

export const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-noto-tc",
  preload: false,
  adjustFontFallback: true,
});
