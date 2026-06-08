"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";
import type { OutfitReviewSummary } from "@/lib/outfit-review-types";
import { dupeGuestHeaders } from "@/lib/dupe-guest-id";

const PAGE_SIZE = 3;
const MAX_CONTENT = 100;

type ReviewPageData = {
  reviews: OutfitReviewSummary[];
  total: number;
  hasMore: boolean;
  mine: OutfitReviewSummary | null;
};

export default function OutfitReviewsSection({
  outfitId,
}: {
  outfitId: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<OutfitReviewSummary[]>([]);
  const [mine, setMine] = useState<OutfitReviewSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const offsetRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const canAutoLoadRef = useRef(false);

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
    async (offset: number, append: boolean) => {
      const res = await fetch(
        `/api/outfits/${outfitId}/reviews?offset=${offset}&limit=${PAGE_SIZE}`,
        { headers: dupeGuestHeaders() }
      );
      const data = (await res.json()) as ReviewPageData & { error?: string };
      if (!res.ok) throw new Error(data.error ?? t("review.loadFail"));
      applyPage(data, append);
      return data;
    },
    [applyPage, outfitId, t]
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    offsetRef.current = 0;
    canAutoLoadRef.current = false;
    try {
      await fetchPage(0, false);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : t("review.loadFail")
      );
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        canAutoLoadRef.current = true;
      });
    }
  }, [fetchPage, t]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

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
    <section className="mt-8 w-full border-t border-border pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
            {t("review.sectionTitle")}
          </h2>
          {total > 0 ? (
            <p className="mt-1 text-sm text-muted">
              {t("review.count", { count: total })}
            </p>
          ) : null}
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted">{t("loading")}</p>
      ) : loadError ? (
        <p className="mt-4 text-sm text-red-600">{loadError}</p>
      ) : total === 0 ? (
        <p className="mt-4 text-sm text-muted">{t("review.empty")}</p>
      ) : (
        <>
          <ul className="mt-4 space-y-3">
            {displayReviews.map((review) => (
              <li
                key={review.id}
                className={`rounded-xl border bg-white p-3 sm:p-4 ${
                  review.isMine ? "border-neutral-300" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900">
                        {review.isAnonymous
                          ? t("review.anonymous")
                          : review.authorName}
                      </span>
                      {review.isMine ? (
                        <span className="rounded-full bg-neutral-100 px-2 py-px text-[10px] text-muted">
                          {t("review.mine")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {review.canEdit || review.canDelete ? (
                    <div className="flex shrink-0 items-center gap-2">
                      {review.canEdit ? (
                        <button
                          type="button"
                          onClick={() => startEdit(review)}
                          className="cursor-pointer text-xs text-neutral-600 hover:text-neutral-900 hover:underline"
                        >
                          {t("review.edit")}
                        </button>
                      ) : null}
                      {review.canDelete ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(review.id)}
                          className="cursor-pointer text-xs text-red-600 hover:underline"
                        >
                          {t("review.delete")}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <p className="mt-2 break-words text-sm text-neutral-700">
                  {review.content}
                </p>
              </li>
            ))}
          </ul>
          {hasMore ? (
            <div
              ref={sentinelRef}
              className="mt-4 flex flex-col items-center gap-2 py-2"
            >
              {loadingMore ? (
                <p className="text-xs text-muted">{t("loading")}</p>
              ) : (
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  className="cursor-pointer text-xs text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
                >
                  {t("review.loadMore")}
                </button>
              )}
            </div>
          ) : null}
        </>
      )}

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-3 rounded-xl border border-border bg-neutral-50/50 p-4"
        >
          <h3 className="text-sm font-medium text-neutral-900">
            {editingId ? t("review.editTitle") : t("review.formTitle")}
          </h3>
          {!user ? (
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t("review.nicknamePlaceholder")}
              maxLength={32}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
          ) : (
            <p className="text-xs text-muted">
              {t("review.loggedInAs", { name: user.account })}
            </p>
          )}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={MAX_CONTENT}
              required
              placeholder={t("review.contentPlaceholder")}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
            <p className="mt-1 text-right text-[11px] text-muted">
              {content.length}/{MAX_CONTENT}
            </p>
          </div>
          <div className="flex gap-2">
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="flex-1 rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-neutral-700 disabled:opacity-50"
              >
                {t("review.cancelEdit")}
              </button>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting
                ? t("review.submitting")
                : editingId
                  ? t("review.updateBtn")
                  : t("review.submitBtn")}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
