export const SUBMISSIONS_KEY = "yeji-outfits-submissions";

export function getSubmissionIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function setSubmissionIds(ids: string[]): void {
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(ids));
}

export function addSubmissionId(id: string): void {
  const ids = getSubmissionIds();
  if (!ids.includes(id)) {
    setSubmissionIds([id, ...ids]);
  }
}

export function removeSubmissionId(id: string): void {
  setSubmissionIds(getSubmissionIds().filter((x) => x !== id));
}

export function clearSubmissionIds(): void {
  localStorage.removeItem(SUBMISSIONS_KEY);
}

export function getSubmissionIdsQuery(): string {
  const ids = getSubmissionIds();
  if (ids.length === 0) return "";
  return `ids=${encodeURIComponent(ids.join(","))}`;
}
