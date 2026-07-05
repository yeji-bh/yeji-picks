import "server-only";

import {
  DEFAULT_GALLERY_SORT,
  parseGallerySort,
} from "@/lib/gallery-sort";
import { matchesGalleryProductQuery } from "@/lib/list-filters";

export type GalleryProductSummary = {
  id: string;
  image: string;
  name: string;
  brand: string;
  officialLink: string;
  searchText: string;
};

export type GalleryProductListResult = {
  items: GalleryProductSummary[];
  total: number;
  hasMore: boolean;
};

const productSelect = {
  id: true,
  image: true,
  name: true,
  brand: true,
  officialLink: true,
} as const;

function toSummary(row: {
  id: string;
  image: string;
  name: string;
  brand: string;
  officialLink: string | null;
}): GalleryProductSummary {
  const name = row.name ?? "";
  const brand = row.brand ?? "";
  return {
    id: row.id,
    image: row.image,
    name,
    brand,
    officialLink: row.officialLink ?? "",
    searchText: [brand, name].filter(Boolean).join(" "),
  };
}

type ProductRow = {
  id: string;
  image: string;
  name: string;
  brand: string;
  officialLink: string | null;
};

type ProductDelegate = {
  findMany: (args: {
    select: typeof productSelect;
    orderBy: { createdAt: "asc" | "desc" };
    take?: number;
    skip?: number;
  }) => Promise<ProductRow[]>;
  count: () => Promise<number>;
};

export async function getGalleryProductList(
  delegate: ProductDelegate,
  limit: number,
  offset: number,
  sort: string | null | undefined,
  withTotal: boolean,
  query = ""
): Promise<GalleryProductListResult> {
  const parsedSort = parseGallerySort(sort);
  const orderBy =
    parsedSort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };
  const q = query.trim();

  if (q) {
    const rows = await delegate.findMany({
      select: productSelect,
      orderBy,
    });
    const filtered = rows
      .map(toSummary)
      .filter((item) => matchesGalleryProductQuery(item, q));
    const items = filtered.slice(offset, offset + limit);
    const filteredTotal = filtered.length;
    const total = withTotal
      ? filteredTotal
      : offset + items.length + (items.length === limit ? 1 : 0);
    return {
      items,
      total,
      hasMore:
        offset + items.length <
        (withTotal
          ? filteredTotal
          : offset + items.length + (items.length === limit ? 1 : 0)),
    };
  }

  const [rows, total] = await Promise.all([
    delegate.findMany({
      select: productSelect,
      orderBy,
      take: limit,
      skip: offset,
    }),
    withTotal ? delegate.count() : Promise.resolve(0),
  ]);

  const items = rows.map(toSummary);

  if (!withTotal) {
    return {
      items,
      total: offset + items.length + (items.length === limit ? 1 : 0),
      hasMore: items.length === limit,
    };
  }

  return {
    items,
    total,
    hasMore: offset + items.length < total,
  };
}

export { DEFAULT_GALLERY_SORT };
