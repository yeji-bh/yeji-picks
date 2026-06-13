import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import AuthProvider from "@/components/AuthProvider";
import FavoritesProvider from "@/components/FavoritesProvider";
import DocumentTitle from "@/components/DocumentTitle";
import ToastProvider from "@/components/ToastProvider";
import HeaderNav from "@/components/HeaderNav";
import I18nProvider from "@/components/I18nProvider";
import SiteFooter from "@/components/SiteFooter";
import ThemeProvider from "@/components/ThemeProvider";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { getAssetBaseUrl } from "@/lib/asset-base";
import { inter, notoSansSC, notoSansTC } from "@/lib/fonts";
import {
  LOCALE_MANUAL_COOKIE,
  resolveInitialLocale,
} from "@/lib/i18n/resolve-locale";
import { LOCALE_COOKIE } from "@/lib/i18n/settings";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const assetBase = getAssetBaseUrl();
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = resolveInitialLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    cookieStore.get(LOCALE_MANUAL_COOKIE)?.value,
    headerStore.get("accept-language")
  );

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {assetBase ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__ASSET_BASE__=${JSON.stringify(assetBase)}`,
            }}
          />
        ) : null}
      </head>
      <body
        className={`${inter.variable} ${notoSansSC.variable} ${notoSansTC.variable} flex min-h-dvh flex-col`}
      >
        <ThemeProvider>
          <I18nProvider initialLocale={locale}>
            <AuthProvider>
              <FavoritesProvider>
                <DocumentTitle />
                <ToastProvider>
                  <HeaderNav />
                  <main className="mx-auto w-full max-w-7xl flex-1 bg-surface px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
                    {children}
                  </main>
                  <SiteFooter />
                  <ScrollToTopButton />
                </ToastProvider>
              </FavoritesProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
