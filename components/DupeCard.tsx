"use client";

import Image from "next/image";
import { assetUrl } from "@/lib/asset-url";
import { cdnImageProps } from "@/lib/remote-image";
import type { DupeSummary } from "@/lib/catalog-dupe-types";

export default function DupeCard({
  dupe,
  adminDelete,
}: {
  dupe: DupeSummary;
  adminDelete?: React.ReactNode;
}) {
  return (
    <article className="group min-w-0">
      <a
        href={dupe.buyLink}
        target="_blank"
        rel="noopener noreferrer"
        className="item-image-surface relative block aspect-[3/4] w-full overflow-hidden"
      >
        <Image
          src={assetUrl(dupe.image)}
          alt={dupe.productName ?? dupe.brand}
          fill
          className="object-contain"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loading="lazy"
          {...cdnImageProps()}
        />
      </a>
      <div className="mt-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            {dupe.priceRange ? (
              <p className="text-sm text-neutral-500">{dupe.priceRange}</p>
            ) : null}
            <a
              href={dupe.buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-base font-bold text-neutral-900 hover:underline"
            >
              {dupe.brand}
            </a>
            {dupe.productName ? (
              <a
                href={dupe.buyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block break-words text-lg leading-snug text-neutral-800 line-clamp-2 hover:underline"
              >
                {dupe.productName}
              </a>
            ) : null}
          </div>
          {adminDelete ? (
            <div className="shrink-0 self-end">{adminDelete}</div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
