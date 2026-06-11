import type { TFunction } from "i18next";

export function formatReviewTime(iso: string, t: TFunction): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);

  if (minutes < 1) return t("review.timeJustNow");
  if (minutes < 60) return t("review.timeMinutes", { count: minutes });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("review.timeHours", { count: hours });

  const days = Math.floor(hours / 24);
  if (days < 30) return t("review.timeDays", { count: days });

  return new Date(iso).toLocaleDateString();
}
