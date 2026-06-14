/** True on Cloudflare Workers — not local `next dev`. */
export function isCloudflareWorker(): boolean {
  return (
    typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair ===
    "function"
  );
}
