import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function getInfoUpdatesMarkdown(): Promise<string> {
  const filePath = path.join(process.cwd(), "content", "info-updates.md");
  return readFile(filePath, "utf8");
}
