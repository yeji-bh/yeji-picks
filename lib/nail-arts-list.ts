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

export async function getNailArtList(
  limit: number,
  offset: number,
  sort: string | null | undefined,
  withTotal: boolean
): Promise<NailArtListResult> {
  const parsedSort = parseGallerySort(sort);
  const orderBy =
    parsedSort === "oldest" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };

  const [rows, total] = await Promise.all([
    prisma.nailArt.findMany({
      select: { id: true, image: true },
      orderBy,
      take: limit,
      skip: offset,
    }),
    withTotal ? prisma.nailArt.count() : Promise.resolve(0),
  ]);

  if (!withTotal) {
    return {
      nailArts: rows,
      total: offset + rows.length + (rows.length === limit ? 1 : 0),
      hasMore: rows.length === limit,
    };
  }

  return {
    nailArts: rows,
    total,
    hasMore: offset + rows.length < total,
  };
}

export { DEFAULT_GALLERY_SORT };
