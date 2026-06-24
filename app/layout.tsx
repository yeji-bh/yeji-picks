import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import AuthProvider from "@/components/AuthProvider";
import I18nProvider from "@/components/I18nProvider";
import ThemeProvider from "@/components/ThemeProvider";
import { getAssetBaseUrl } from "@/lib/asset-base";
import { buildSiteMetadata } from "@/lib/site-metadata";
import { localeFontBodyClass } from "@/lib/locale-font-class";
import {
  LOCALE_MANUAL_COOKIE,
  resolveInitialLocale,
} from "@/lib/i18n/resolve-locale";
import { LOCALE_COOKIE } from "@/lib/i18n/settings";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const IMAGE_CDN_ORIGIN = "https://img.yejipicks.top";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = resolveInitialLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    cookieStore.get(LOCALE_MANUAL_COOKIE)?.value,
    headerStore.get("accept-language")
  );
  return {
    ...buildSiteMetadata(locale),
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
  const fontBodyClass = await localeFontBodyClass(locale);
  const imageCdnOrigin = assetBase
    ? new URL(assetBase).origin
    : IMAGE_CDN_ORIGIN;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="preconnect" href={imageCdnOrigin} crossOrigin="" />
        {assetBase ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__ASSET_BASE__=${JSON.stringify(assetBase)}`,
            }}
          />
        ) : null}
      </head>
      <body className={`${fontBodyClass} flex min-h-dvh flex-col`}>
        <ThemeProvider>
          <I18nProvider initialLocale={locale}>
            <AuthProvider>{children}</AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
