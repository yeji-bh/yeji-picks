type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const ROUTE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/upload": { max: 30, windowMs: 60 * 60 * 1000 },
  "/api/auth/register": { max: 5, windowMs: 60 * 60 * 1000 },
  "/api/auth/login": { max: 30, windowMs: 60 * 60 * 1000 },
  "/api/submit": { max: 15, windowMs: 60 * 60 * 1000 },
  "/api/feedback": { max: 20, windowMs: 60 * 60 * 1000 },
  "/api/report": { max: 20, windowMs: 60 * 60 * 1000 },
};

const DEFAULT_LIMIT = { max: 120, windowMs: 60 * 1000 };

function getLimit(pathname: string) {
  for (const [route, limit] of Object.entries(ROUTE_LIMITS)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return limit;
    }
  }
  return DEFAULT_LIMIT;
}

export function checkRateLimit(
  ip: string,
  pathname: string
): { ok: true } | { ok: false; retryAfterSec: number } {
  const { max, windowMs } = getLimit(pathname);
  const key = `${ip}:${pathname.split("/").slice(0, 4).join("/")}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= max) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { ok: true };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "unknown";
}
