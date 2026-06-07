import type { Metadata } from "next";
import { cookies } from "next/headers";
import AuthProvider from "@/components/AuthProvider";
import FavoritesProvider from "@/components/FavoritesProvider";
import DocumentTitle from "@/components/DocumentTitle";
import ToastProvider from "@/components/ToastProvider";
import HeaderNav from "@/components/HeaderNav";
import I18nProvider from "@/components/I18nProvider";
import SiteFooter from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/auth";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
} from "@/lib/i18n/settings";
import "./globals.css";

const SITE_TITLE = "YEJI Picks";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SITE_TITLE,
    description: "YEJI Picks — outfits & favorites",
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
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const initialUser = await getCurrentUser();

  return (
    <html lang={locale}>
      <body className="flex min-h-dvh flex-col">
        <I18nProvider initialLocale={locale}>
          <AuthProvider initialUser={initialUser}>
          <FavoritesProvider>
          <DocumentTitle />
          <ToastProvider>
          <HeaderNav />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6">
            {children}
          </main>
          <SiteFooter />
          </ToastProvider>
          </FavoritesProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
