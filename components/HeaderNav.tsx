"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import {
  IconBook,
  IconClipboard,
  IconHeart,
  IconInfo,
  IconRankings,
  IconMessage,
  IconSubmit,
  IconUser,
  NavItem,
} from "./NavIcons";

const FeedbackModal = dynamic(() => import("./FeedbackModal"), { ssr: false });

function IconMenu({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export default function HeaderNav() {
  const { t } = useTranslation();
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.push("/");
    router.refresh();
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const drawerLinkClass =
    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground-secondary hover:bg-subtle";

  return (
    <>
      <header
        id="site-header"
        className="sticky top-0 z-20 border-b border-border bg-header"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-3 py-4 sm:px-5 lg:px-6">
          <Link
            href="/"
            className="min-w-0 shrink cursor-pointer text-lg font-bold tracking-tight text-foreground sm:text-2xl"
          >
            <span className="block truncate">{t("siteTitle")}</span>
          </Link>

          <nav className="hidden items-center gap-1 text-muted lg:flex">
            {isAdmin ? (
              <>
                <NavItem
                  href="/submit"
                  icon={<IconSubmit />}
                  label={t("nav.submit")}
                />
                <NavItem
                  href="/my-submissions"
                  icon={<IconClipboard />}
                  label={t("nav.review")}
                />
              </>
            ) : null}
            <NavItem
              href="/favorites"
              icon={<IconHeart />}
              label={t("nav.favorites")}
            />
            <NavItem
              href="/rankings"
              icon={<IconRankings />}
              label={t("nav.rankings")}
            />
            {isAdmin ? (
              <NavItem
                href="/feedback"
                icon={<IconMessage />}
                label={t("nav.feedback")}
              />
            ) : null}
            {!loading &&
              (user ? (
                <div className="flex items-center gap-1">
                  <span className="flex max-w-[8rem] items-center gap-1.5 truncate rounded-md px-2.5 py-2 text-sm text-foreground-secondary">
                    <IconUser />
                    <span className="truncate">{user.account}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-2 text-sm text-foreground-secondary transition-colors hover:bg-subtle"
                    title={t("auth.logout")}
                  >
                    <span>{t("auth.logout")}</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-subtle px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-neutral-200/60 dark:hover:bg-neutral-200/10"
                  title={t("auth.login")}
                >
                  <IconUser />
                  <span>{t("auth.login")}</span>
                </Link>
              ))}
            <ThemeToggle />
            <LanguageSwitcher />
          </nav>

          <div className="flex items-center gap-0.5 lg:hidden">
            <ThemeToggle />
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex cursor-pointer items-center justify-center rounded-lg p-2 text-foreground-secondary hover:bg-subtle"
              aria-label={t("nav.openMenu")}
            >
              <IconMenu />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeMenu}
            aria-hidden
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(85vw,18rem)] flex-col bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-foreground">
                {t("nav.menu")}
              </span>
              <button
                type="button"
                onClick={closeMenu}
                className="cursor-pointer text-xl leading-none text-inactive hover:text-foreground"
                aria-label={t("nav.closeMenu")}
              >
                ×
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {isAdmin ? (
                <>
                  <Link href="/submit" onClick={closeMenu} className={drawerLinkClass}>
                    <IconSubmit />
                    <span>{t("nav.submit")}</span>
                  </Link>
                  <Link
                    href="/my-submissions"
                    onClick={closeMenu}
                    className={drawerLinkClass}
                  >
                    <IconClipboard />
                    <span>{t("nav.review")}</span>
                  </Link>
                </>
              ) : null}
              <Link
                href="/favorites"
                onClick={closeMenu}
                className={drawerLinkClass}
              >
                <IconHeart />
                <span>{t("nav.favorites")}</span>
              </Link>
              <Link
                href="/rankings"
                onClick={closeMenu}
                className={drawerLinkClass}
              >
                <IconRankings />
                <span>{t("nav.rankings")}</span>
              </Link>
              {isAdmin ? (
                <Link
                  href="/feedback"
                  onClick={closeMenu}
                  className={drawerLinkClass}
                >
                  <IconMessage />
                  <span>{t("nav.feedback")}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    setFeedbackOpen(true);
                  }}
                  className={`${drawerLinkClass} w-full text-left`}
                >
                  <IconMessage />
                  <span>{t("nav.feedback")}</span>
                </button>
              )}
              <Link href="/info" onClick={closeMenu} className={drawerLinkClass}>
                <IconInfo />
                <span>{t("nav.info")}</span>
              </Link>
              <Link href="/guide" onClick={closeMenu} className={drawerLinkClass}>
                <IconBook />
                <span>{t("nav.guide")}</span>
              </Link>
            </nav>

            <div className="border-t border-border p-3">
              {!loading &&
                (user ? (
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 px-3 text-sm text-muted">
                      <IconUser className="h-4 w-4" />
                      <span className="truncate">{user.account}</span>
                    </p>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`${drawerLinkClass} w-full text-left`}
                    >
                      <span>{t("auth.logout")}</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className={drawerLinkClass}
                  >
                    <IconUser />
                    <span>{t("auth.login")}</span>
                  </Link>
                ))}
            </div>
          </aside>
        </div>
      )}

      {!isAdmin && feedbackOpen ? (
        <FeedbackModal
          open={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
        />
      ) : null}
    </>
  );
}
