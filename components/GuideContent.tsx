"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

type GuideSection = {
  id: string;
  titleKey: string;
  descKey: string;
  tipKeys: string[];
  link?: { href: string; labelKey: string };
};

const SECTIONS: GuideSection[] = [
  {
    id: "home",
    titleKey: "guide.sections.home.title",
    descKey: "guide.sections.home.desc",
    tipKeys: [
      "guide.sections.home.tip1",
      "guide.sections.home.tip2",
      "guide.sections.home.tip3",
    ],
    link: { href: "/", labelKey: "guide.links.home" },
  },
  {
    id: "outfit",
    titleKey: "guide.sections.outfit.title",
    descKey: "guide.sections.outfit.desc",
    tipKeys: [
      "guide.sections.outfit.tip1",
      "guide.sections.outfit.tip2",
      "guide.sections.outfit.tip3",
    ],
  },
  {
    id: "item",
    titleKey: "guide.sections.item.title",
    descKey: "guide.sections.item.desc",
    tipKeys: [
      "guide.sections.item.tip1",
      "guide.sections.item.tip2",
      "guide.sections.item.tip3",
    ],
  },
  {
    id: "favorites",
    titleKey: "guide.sections.favorites.title",
    descKey: "guide.sections.favorites.desc",
    tipKeys: [
      "guide.sections.favorites.tip1",
      "guide.sections.favorites.tip2",
    ],
    link: { href: "/favorites", labelKey: "guide.links.favorites" },
  },
  {
    id: "submit",
    titleKey: "guide.sections.submit.title",
    descKey: "guide.sections.submit.desc",
    tipKeys: [
      "guide.sections.submit.tip1",
      "guide.sections.submit.tip2",
      "guide.sections.submit.tip3",
    ],
    link: { href: "/submit", labelKey: "guide.links.submit" },
  },
  {
    id: "reviews",
    titleKey: "guide.sections.reviews.title",
    descKey: "guide.sections.reviews.desc",
    tipKeys: [
      "guide.sections.reviews.tip1",
      "guide.sections.reviews.tip2",
    ],
  },
  {
    id: "dupes",
    titleKey: "guide.sections.dupes.title",
    descKey: "guide.sections.dupes.desc",
    tipKeys: [
      "guide.sections.dupes.tip1",
      "guide.sections.dupes.tip2",
    ],
  },
  {
    id: "feedback",
    titleKey: "guide.sections.feedback.title",
    descKey: "guide.sections.feedback.desc",
    tipKeys: [
      "guide.sections.feedback.tip1",
      "guide.sections.feedback.tip2",
    ],
  },
  {
    id: "account",
    titleKey: "guide.sections.account.title",
    descKey: "guide.sections.account.desc",
    tipKeys: [
      "guide.sections.account.tip1",
      "guide.sections.account.tip2",
    ],
  },
  {
    id: "settings",
    titleKey: "guide.sections.settings.title",
    descKey: "guide.sections.settings.desc",
    tipKeys: [
      "guide.sections.settings.tip1",
      "guide.sections.settings.tip2",
    ],
  },
];

export default function GuideContent() {
  const { t } = useTranslation();

  return (
    <div className="min-w-0">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          {t("guide.title")}
        </h1>
      </header>

      <nav
        aria-label={t("guide.toc")}
        className="mb-8 rounded-xl border border-border bg-card p-4 sm:p-5"
      >
        <h2 className="text-sm font-semibold text-foreground">{t("guide.toc")}</h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {SECTIONS.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-sm text-foreground-secondary underline-offset-2 hover:text-foreground hover:underline"
              >
                {index + 1}. {t(section.titleKey)}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24 rounded-xl border border-border bg-card p-4 sm:p-6"
          >
            <h2 className="text-lg font-semibold text-foreground">
              {t(section.titleKey)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground-secondary sm:text-base">
              {t(section.descKey)}
            </p>
            <ul className="mt-4 space-y-2">
              {section.tipKeys.map((key) => (
                <li
                  key={key}
                  className="flex gap-2 text-sm leading-relaxed text-muted"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            {section.link ? (
              <Link
                href={section.link.href}
                className="mt-4 inline-block text-sm font-medium text-accent underline-offset-2 hover:underline"
              >
                {t(section.link.labelKey)} →
              </Link>
            ) : null}
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-subtle p-5 text-center sm:p-6">
        <p className="text-sm text-foreground-secondary">{t("guide.outro")}</p>
        <Link
          href="/"
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {t("guide.ctaHome")}
        </Link>
      </div>
    </div>
  );
}
