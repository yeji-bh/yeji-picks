"use client";

import { useTranslation } from "react-i18next";
import LoadingSpinner from "./LoadingSpinner";

export default function AppLoading() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingSpinner label={t("loading")} />
    </div>
  );
}
