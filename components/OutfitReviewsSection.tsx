"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";
import type { OutfitReviewPage, OutfitReviewSummary } from "@/lib/outfit-review-types";
import { dupeGuestHeaders } from "@/lib/dupe-guest-id";
import { formatReviewTime } from "@/lib/review-time";

const PAGE_SIZE = 3;
const MAX_CONTENT = 100;

type ReviewPageData = OutfitReviewPage;

export default function OutfitReviewsSection({
  outfitId,
  initialPage,
}: {
  outfitId: string;
  initialPage?: OutfitReviewPage;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<OutfitReviewSummary[]>(
    initialPage?.reviews ?? []
  );
  const [mine, setMine] = useState<OutfitReviewSummary | null>(
    initialPage?.mine ?? null
  );
  const [total, setTotal] = useState(initialPage?.total ?? 0);
  const [hasMore, setHasMore] = useState(initialPage?.hasMore ?? false);
  const [loading, setLoading] = useState(!initialPage);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const offsetRef = useRef(initialPage?.reviews.length ?? 0);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const canAutoLoadRef = useRef(!!initialPage);

  const applyPage = useCallback((data: ReviewPageData, append: boolean) => {
    if (append) {
      setReviews((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        const next = data.reviews.filter((r) => !seen.has(r.id));
        return next.length > 0 ? [...prev, ...next] : prev;
      });
      offsetRef.current += data.reviews.length;
      setHasMore(data.hasMore && data.reviews.length > 0);
    } else {
      setReviews(data.reviews);
      offsetRef.current = data.reviews.length;
      setHasMore(data.hasMore);
    }
    setTotal(data.total);
    setMine(data.mine);
  }, []);

  const fetchPage = useCallback(
    async (offset: number, append: boolean, signal?: AbortSignal) => {
      const res = await fetch(
        `/api/outfits/${outfitId}/reviews?offset=${offset}&limit=${PAGE_SIZE}`,
        { headers: dupeGuestHeaders(), signal }
      );
      const data = (await res.json()) as ReviewPageData & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "review load failed");
      applyPage(data, append);
      return data;
    },
    [applyPage, outfitId]
  );

  const loadInitial = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setLoadError(null);
      offsetRef.current = 0;
      canAutoLoadRef.current = false;
      try {
        await fetchPage(0, false, signal);
      } catch (err) {
        if (signal?.aborted) return;
        setLoadError(err instanceof Error ? err.message : "review load failed");
      } finally {
        if (signal?.aborted) return;
        setLoading(false);
        requestAnimationFrame(() => {
          canAutoLoadRef.current = true;
        });
      }
    },
    [fetchPage]
  );

  useEffect(() => {
    if (initialPage) {
      applyPage(initialPage, false);
      offsetRef.current = initialPage.reviews.length;
      setLoading(false);
      setLoadError(null);
      canAutoLoadRef.current = false;
      requestAnimationFrame(() => {
        canAutoLoadRef.current = true;
      });
      return;
    }

    const controller = new AbortController();
    void loadInitial(controller.signal);
    return () => controller.abort();
  }, [outfitId, initialPage, applyPage, loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || loading) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      await fetchPage(offsetRef.current, true);
    } catch {
      setHasMore(false);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loading]);

  useEffect(() => {
    if (!hasMore || loading) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || !canAutoLoadRef.current) return;
        void loadMore();
      },
      { root: null, rootMargin: "0px 0px 200px 0px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore, reviews.length]);

  const displayReviews = useMemo(() => {
    if (!mine) return reviews;
    if (reviews.some((r) => r.id === mine.id)) return reviews;
    return [mine, ...reviews];
  }, [mine, reviews]);

  function resetForm() {
    setNickname("");
    setContent("");
    setEditingId(null);
  }

  function startEdit(review: OutfitReviewSummary) {
    setEditingId(review.id);
    setContent(review.content);
    setNickname("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      showToast(t("review.contentRequired"), "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        content: content.trim(),
        ...(user ? {} : { nickname: nickname.trim() || undefined }),
      };

      const isEdit = editingId != null;
      const res = await fetch(
        isEdit
          ? `/api/outfits/${outfitId}/reviews/${editingId}`
          : `/api/outfits/${outfitId}/reviews`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...dupeGuestHeaders(),
          },
          body: JSON.stringify(payload),
        }
      );
      const data = (await res.json()) as ReviewPageData & { error?: string };
      if (!res.ok) throw new Error(data.error ?? t("review.submitFail"));

      applyPage(data, false);
      resetForm();
      showToast(isEdit ? t("review.updateSuccess") : t("review.submitSuccess"));
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("review.submitFail"),
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(reviewId: string) {
    if (!confirm(t("review.deleteConfirm"))) return;

    try {
      const res = await fetch(`/api/outfits/${outfitId}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: dupeGuestHeaders(),
      });
      const data = (await res.json()) as ReviewPageData & { error?: string };
      if (!res.ok) throw new Error(data.error ?? t("review.deleteFail"));

      applyPage(data, false);
      if (editingId === reviewId) resetForm();
      showToast(t("review.deleteSuccess"));
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("review.deleteFail"),
        "error"
      );
    }
  }

  const showForm = !mine || editingId != null;

  return (
    <section className="mt-8 w-full sm:mt-10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-foreground sm:text-lg">
          {t("review.sectionTitle")}
        </h2>
        <span className="text-xs text-muted sm:text-sm">
          {t("review.count", { count: total })}
        </span>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-4 sm:mt-5">
          {!user ? (
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t("review.nicknamePlaceholder")}
              maxLength={32}
              className="ui-field mb-2.5 px-2.5 py-1.5 text-xs sm:mb-3 sm:px-3 sm:py-2 sm:text-sm"
            />
          ) : (
            <p className="mb-2.5 text-xs text-muted sm:mb-3 sm:text-sm">
              {t("review.loggedInAs", { name: user.account })}
            </p>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={MAX_CONTENT}
            required
            placeholder={t("review.contentPlaceholder")}
            className="ui-field w-full resize-none px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm"
          />
          <div className="mt-1.5 flex items-center justify-between gap-2 sm:mt-2 sm:gap-3">
            <span className="text-xs text-muted sm:text-sm">
              {content.length}/{MAX_CONTENT}
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="ui-btn-secondary cursor-pointer px-2.5 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm"
                >
                  {t("review.cancelEdit")}
                </button>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className="ui-btn-primary cursor-pointer px-3 py-1.5 text-xs sm:px-5 sm:py-2.5 sm:text-sm"
              >
                {submitting
                  ? t("review.submitting")
                  : editingId
                    ? t("review.updateBtn")
                    : t("review.submitBtn")}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="mt-5 text-xs text-muted sm:mt-6 sm:text-sm">{t("loading")}</p>
      ) : loadError ? (
        <p className="mt-5 text-xs text-red-600 sm:mt-6 sm:text-sm">{t("review.loadFail")}</p>
      ) : total === 0 ? (
        <p className="mt-5 text-xs text-muted sm:mt-6 sm:text-sm">{t("review.empty")}</p>
      ) : (
        <>
          <ul className="mt-6 space-y-5 sm:mt-8 sm:space-y-7">
            {displayReviews.map((review) => (
              <li key={review.id} className="space-y-1.5 sm:space-y-2">
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground sm:text-sm">
                      {review.isAnonymous
                        ? t("review.anonymous")
                        : review.authorName}
                    </span>
                    {review.isMine ? (
                      <span className="ml-1.5 text-xs text-muted sm:ml-2 sm:text-sm">
                        {t("review.mine")}
                      </span>
                    ) : null}
                  </div>
                  <time
                    dateTime={review.createdAt}
                    className="shrink-0 text-xs text-muted sm:text-sm"
                  >
                    {formatReviewTime(review.createdAt, t)}
                  </time>
                </div>
                <p className="break-words text-xs leading-relaxed text-foreground-secondary sm:text-sm">
                  {review.content}
                </p>
                {review.canEdit || review.canDelete ? (
                  <div className="flex items-center gap-2 pt-0.5 sm:gap-3">
                    {review.canEdit ? (
                      <button
                        type="button"
                        onClick={() => startEdit(review)}
                        className="cursor-pointer text-xs text-muted hover:text-foreground hover:underline sm:text-sm"
                      >
                        {t("review.edit")}
                      </button>
                    ) : null}
                    {review.canDelete ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(review.id)}
                        className="cursor-pointer text-xs text-muted hover:text-red-600 hover:underline sm:text-sm"
                      >
                        {t("review.delete")}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {hasMore ? (
            <div
              ref={sentinelRef}
              className="mt-5 flex flex-col items-center gap-2 py-2 sm:mt-6"
            >
              {loadingMore ? (
                <p className="text-xs text-muted sm:text-sm">{t("loading")}</p>
              ) : (
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  className="cursor-pointer text-xs text-muted underline-offset-2 hover:text-foreground hover:underline sm:text-sm"
                >
                  {t("review.loadMore")}
                </button>
              )}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
