"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { assetUrl } from "@/lib/asset-url";
import { cdnImageProps } from "@/lib/remote-image";
import { COVER_ASPECT_CLASS } from "@/lib/image";
import { outfitHref } from "@/lib/entity-href";
import { formatOutfitTitle } from "@/lib/outfit";
import FavoriteButton from "./FavoriteButton";
import ItemTypeBadges from "./ItemTypeBadges";
import { saveHomeScrollIfHome } from "@/lib/home-scroll";

type OutfitCardProps = {
  id: string;
  mainImage: string;
  eventName: string;
  date: string;
  itemTypes?: string[];
};

export default function OutfitCard({
  id,
  mainImage,
  eventName,
  date,
  itemTypes = [],
}: OutfitCardProps) {
  const { t } = useTranslation();
  const title = formatOutfitTitle(date, eventName);
  const displayTitle = title === "outfit" ? t("outfit.unnamed") : title;
  const imageRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = imageRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <article className="group min-w-0">
      <Link
        href={outfitHref({ id, date, eventName })}
        prefetch={false}
        onClick={() => saveHomeScrollIfHome()}
        className="block"
      >
        <div
          ref={imageRef}
          className={`relative w-full overflow-hidden bg-cover ${COVER_ASPECT_CLASS}`}
        >
          {!inView ? (
            <div className="absolute inset-0 animate-pulse bg-neutral-200" aria-hidden />
          ) : (
            <Image
              src={assetUrl(mainImage)}
              alt={displayTitle}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
              {...cdnImageProps()}
            />
          )}
        </div>
      </Link>
      <div className="mt-2.5 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={outfitHref({ id, date, eventName })}
            prefetch={false}
            onClick={() => saveHomeScrollIfHome()}
            className="min-w-0 flex-1 break-words text-base font-semibold leading-snug text-neutral-900 line-clamp-2 hover:underline sm:text-[17px]"
          >
            {displayTitle}
          </Link>
          <FavoriteButton type="outfit" targetId={id} variant="inline" size="md" />
        </div>
        <ItemTypeBadges types={itemTypes} />
      </div>
    </article>
  );
}
