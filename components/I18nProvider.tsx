"use client";

import { I18nextProvider } from "react-i18next";
import { initI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/settings";

export default function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const i18n = initI18n(initialLocale);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
