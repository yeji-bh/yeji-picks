import "server-only";

import type { NextRequest } from "next/server";

const GUEST_HEADER = "x-dupe-guest";
const GUEST_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

export function voterKeyForUser(userId: string): string {
  return `u:${userId}`;
}

export function voterKeyForGuest(guestId: string): string {
  return `g:${guestId}`;
}

export function resolveVoterKey(
  request: NextRequest,
  userId: string | null | undefined
): string | null {
  if (userId) return voterKeyForUser(userId);

  const guestId = request.headers.get(GUEST_HEADER)?.trim();
  if (!guestId || !GUEST_ID_RE.test(guestId)) return null;

  return voterKeyForGuest(guestId);
}
