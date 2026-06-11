import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import FavoritesProvider from "@/components/FavoritesProvider";
import DocumentTitle from "@/components/DocumentTitle";
import ToastProvider from "@/components/ToastProvider";
import HeaderNav from "@/components/HeaderNav";
import I18nProvider from "@/components/I18nProvider";
import SiteFooter from "@/components/SiteFooter";
import { DEFAULT_LOCALE } from "@/lib/i18n/settings";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { getAssetBaseUrl } from "@/lib/asset-base";
import "./globals.css";

const SITE_TITLE = "YEJI Picks";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SITE_TITLE,
    description: "YEJI Picks — outfits & favorites",
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const assetBase = getAssetBaseUrl();

  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        {assetBase ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__ASSET_BASE__=${JSON.stringify(assetBase)}`,
            }}
          />
        ) : null}
      </head>
      <body className="flex min-h-dvh flex-col">
        <I18nProvider initialLocale={DEFAULT_LOCALE}>
          <AuthProvider>
          <FavoritesProvider>
          <DocumentTitle />
          <ToastProvider>
          <HeaderNav />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6">
            {children}
          </main>
          <SiteFooter />
          <ScrollToTopButton />
          </ToastProvider>
          </FavoritesProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
