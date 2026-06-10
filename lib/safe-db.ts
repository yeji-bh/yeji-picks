import "server-only";

/** True when build/runtime can reach the remote Turso database. */
export function canQueryRemoteDb(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("libsql:") && !!process.env.TURSO_AUTH_TOKEN;
}

/** Run a DB query; return fallback when DB is unavailable (e.g. CI build without Turso). */
export async function safeDbQuery<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!canQueryRemoteDb()) return fallback;
  try {
    return await fn();
  } catch (err) {
    console.warn("[safe-db]", err);
    return fallback;
  }
}
