import "server-only";

import { prisma } from "@/lib/db";
import {
  DEFAULT_GALLERY_SORT,
  parseGallerySort,
} from "@/lib/gallery-sort";
import { matchesPhoneCaseQuery } from "@/lib/list-filters";

export type PhoneCaseSummary = {
  id: string;
  image: string;
  brand: string;
  model: string;
  officialLink: string;
  searchText: string;
};

export type PhoneCaseListResult = {
  phoneCases: PhoneCaseSummary[];
  total: number;
  hasMore: boolean;
};

function toPhoneCaseSummary(row: {
  id: string;
  image: string;
  brand: string;
  model: string;
  officialLink: string | null;
}): PhoneCaseSummary {
  return {
    id: row.id,
    image: row.image,
    brand: row.brand,
    model: row.model,
    officialLink: row.officialLink ?? "",
    searchText: [row.brand, row.model].filter(Boolean).join(" "),
  };
}

export async function getPhoneCaseList(
  limit: number,
  offset: number,
  sort: string | null | undefined,
  withTotal: boolean,
  query = ""
): Promise<PhoneCaseListResult> {
  const parsedSort = parseGallerySort(sort);
  const orderBy =
    parsedSort === "oldest" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };
  const q = query.trim();

  if (q) {
    const rows = await prisma.phoneCase.findMany({
      select: {
        id: true,
        image: true,
        brand: true,
        model: true,
        officialLink: true,
      },
      orderBy,
    });
    const filtered = rows
      .map(toPhoneCaseSummary)
      .filter((phoneCase) => matchesPhoneCaseQuery(phoneCase, q));
    const phoneCases = filtered.slice(offset, offset + limit);
    const filteredTotal = filtered.length;
    const total = withTotal
      ? filteredTotal
      : offset + phoneCases.length + (phoneCases.length === limit ? 1 : 0);
    return {
      phoneCases,
      total,
      hasMore:
        offset + phoneCases.length <
        (withTotal
          ? filteredTotal
          : offset + phoneCases.length + (phoneCases.length === limit ? 1 : 0)),
    };
  }

  const [rows, total] = await Promise.all([
    prisma.phoneCase.findMany({
      select: {
        id: true,
        image: true,
        brand: true,
        model: true,
        officialLink: true,
      },
      orderBy,
      take: limit,
      skip: offset,
    }),
    withTotal ? prisma.phoneCase.count() : Promise.resolve(0),
  ]);

  const phoneCases = rows.map(toPhoneCaseSummary);

  if (!withTotal) {
    return {
      phoneCases,
      total: offset + phoneCases.length + (phoneCases.length === limit ? 1 : 0),
      hasMore: phoneCases.length === limit,
    };
  }

  return {
    phoneCases,
    total,
    hasMore: offset + phoneCases.length < total,
  };
}

export { DEFAULT_GALLERY_SORT };
