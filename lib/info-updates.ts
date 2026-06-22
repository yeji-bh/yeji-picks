import "server-only";

import bundledUpdates from "@/content/info-updates.md";

export async function getInfoUpdatesMarkdown(): Promise<string> {
  if (process.env.NODE_ENV === "development") {
    try {
      const { readFile } = await import("node:fs/promises");
      const path = await import("node:path");
      return readFile(path.join(process.cwd(), "content", "info-updates.md"), "utf8");
    } catch {
      /* use bundled copy */
    }
  }
  return bundledUpdates;
}
