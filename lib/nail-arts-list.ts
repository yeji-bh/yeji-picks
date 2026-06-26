import "server-only";

import { prisma } from "@/lib/db";
import {
  DEFAULT_GALLERY_SORT,
  parseGallerySort,
  type GallerySort,
} from "@/lib/gallery-sort";

export type NailArtSummary = {
  id: string;
  image: string;
};

export type NailArtListResult = {
  nailArts: NailArtSummary[];
  total: number;
  hasMore: boolean;
};

type NailArtRow = {
  id: string;
  image: string;
  createdAt: Date;
};

/** Keep one row per image URL (newest wins) to avoid inflated counts from duplicate uploads. */
function dedupeNailArtsByImage(
  rows: NailArtRow[],
  sort: GallerySort
): NailArtRow[] {
  const ordered =
    sort === "oldest"
      ? [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      : [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const seen = new Set<string>();
  const unique: NailArtRow[] = [];
  for (const row of ordered) {
    const key = row.image.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }
  return unique;
}

export async function getNailArtList(
  limit: number,
  offset: number,
  sort: string | null | undefined,
  withTotal: boolean
): Promise<NailArtListResult> {
  const parsedSort = parseGallerySort(sort);

  const rows = await prisma.nailArt.findMany({
    select: { id: true, image: true, createdAt: true },
  });

  const unique = dedupeNailArtsByImage(rows, parsedSort);
  const page = unique.slice(offset, offset + limit);
  const nailArts = page.map(({ id, image }) => ({ id, image }));

  if (!withTotal) {
    return {
      nailArts,
      total: offset + nailArts.length + (nailArts.length === limit ? 1 : 0),
      hasMore: nailArts.length === limit,
    };
  }

  const total = unique.length;
  return {
    nailArts,
    total,
    hasMore: offset + nailArts.length < total,
  };
}

export { DEFAULT_GALLERY_SORT };
