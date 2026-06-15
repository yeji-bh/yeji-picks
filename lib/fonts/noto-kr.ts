import { Noto_Sans_KR } from "next/font/google";

export const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-noto-kr",
  preload: false,
  adjustFontFallback: true,
});
