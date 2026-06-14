import { Noto_Sans_SC } from "next/font/google";

export const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-noto-sc",
  preload: false,
  adjustFontFallback: true,
});
