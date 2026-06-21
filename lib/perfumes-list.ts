import "server-only";

import { prisma } from "@/lib/db";
import {
  DEFAULT_GALLERY_SORT,
  parseGallerySort,
} from "@/lib/gallery-sort";
import { matchesPerfumeQuery } from "@/lib/list-filters";

export type PerfumeSummary = {
  id: string;
  image: string;
  name: string;
  brand: string;
  description: string;
  officialLink: string;
  searchText: string;
};

export type PerfumeListResult = {
  perfumes: PerfumeSummary[];
  total: number;
  hasMore: boolean;
};

function toPerfumeSummary(row: {
  id: string;
  image: string;
  name: string;
  brand: string;
  description: string | null;
  officialLink: string | null;
}): PerfumeSummary {
  const description = row.description ?? "";
  return {
    id: row.id,
    image: row.image,
    name: row.name,
    brand: row.brand,
    description,
    officialLink: row.officialLink ?? "",
    searchText: [row.brand, row.name, description].filter(Boolean).join(" "),
  };
}

const perfumeSelect = {
  id: true,
  image: true,
  name: true,
  brand: true,
  description: true,
  officialLink: true,
} as const;

export async function getPerfumeList(
  limit: number,
  offset: number,
  sort: string | null | undefined,
  withTotal: boolean,
  query = ""
): Promise<PerfumeListResult> {
  const parsedSort = parseGallerySort(sort);
  const orderBy =
    parsedSort === "oldest" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };
  const q = query.trim();

  if (q) {
    const rows = await prisma.perfume.findMany({
      select: perfumeSelect,
      orderBy,
    });
    const filtered = rows
      .map(toPerfumeSummary)
      .filter((perfume) => matchesPerfumeQuery(perfume, q));
    const perfumes = filtered.slice(offset, offset + limit);
    const filteredTotal = filtered.length;
    const total = withTotal
      ? filteredTotal
      : offset + perfumes.length + (perfumes.length === limit ? 1 : 0);
    return {
      perfumes,
      total,
      hasMore:
        offset + perfumes.length <
        (withTotal
          ? filteredTotal
          : offset + perfumes.length + (perfumes.length === limit ? 1 : 0)),
    };
  }

  const [rows, total] = await Promise.all([
    prisma.perfume.findMany({
      select: perfumeSelect,
      orderBy,
      take: limit,
      skip: offset,
    }),
    withTotal ? prisma.perfume.count() : Promise.resolve(0),
  ]);

  const perfumes = rows.map(toPerfumeSummary);

  if (!withTotal) {
    return {
      perfumes,
      total: offset + perfumes.length + (perfumes.length === limit ? 1 : 0),
      hasMore: perfumes.length === limit,
    };
  }

  return {
    perfumes,
    total,
    hasMore: offset + perfumes.length < total,
  };
}

export { DEFAULT_GALLERY_SORT };
