"use client";

import dynamic from "next/dynamic";
import FavoritesProvider from "@/components/FavoritesProvider";
import DocumentTitle from "@/components/DocumentTitle";
import ToastProvider from "@/components/ToastProvider";
import HeaderNav from "@/components/HeaderNav";
import SiteFooter from "@/components/SiteFooter";

const ScrollToTopButton = dynamic(() => import("@/components/ScrollToTopButton"), {
  ssr: false,
});

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
