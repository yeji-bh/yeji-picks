import { Inter, Noto_Sans_SC, Noto_Sans_TC } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-noto-sc",
  preload: false,
});

export const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-noto-tc",
  preload: false,
});
