import { Inter } from "next/font/google";

/** Single variable file; covers 400–600 used in UI. */
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  adjustFontFallback: true,
});
