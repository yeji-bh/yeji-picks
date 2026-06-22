"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider";
import FeedbackModal from "./FeedbackModal";

const footerLinkClass =
  "text-foreground-secondary transition-colors hover:text-foreground";

export default function SiteFooter() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  return (
    <footer id="site-footer" className="mt-auto border-t border-border bg-header">
      <div className="mx-auto max-w-7xl space-y-2 px-3 py-4 text-center text-xs text-muted sm:px-5">
        <nav className="hidden flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-sm lg:flex">
          <Link href="/info" className={footerLinkClass}>
            {t("nav.info")}
          </Link>
          <span aria-hidden className="text-inactive">
            ·
          </span>
          <Link href="/guide" className={footerLinkClass}>
            {t("nav.guide")}
          </Link>
          <span aria-hidden className="text-inactive">
            ·
          </span>
          {isAdmin ? (
            <Link href="/feedback" className={footerLinkClass}>
              {t("nav.feedback")}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className={`cursor-pointer ${footerLinkClass}`}
            >
              {t("nav.feedback")}
            </button>
          )}
        </nav>
        <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-[10px] leading-snug sm:gap-2 sm:text-xs">
          <span className="whitespace-nowrap">© {t("siteTitle")} 2026</span>
          <span className="text-inactive" aria-hidden>
            |
          </span>
          <span className="text-center">{t("info.credits.matchingLabel")}</span>
          <Link
            href="https://x.com/yejiwears_"
            target="_blank"
            rel="noreferrer"
            className="whitespace-nowrap text-accent underline-offset-2 hover:underline"
          >
            @yejiwears_
          </Link>
        </div>
      </div>

      {!isAdmin && (
        <FeedbackModal
          open={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
        />
      )}
    </footer>
  );
}
