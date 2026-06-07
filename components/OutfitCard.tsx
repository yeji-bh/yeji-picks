"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { assetUrl } from "@/lib/asset-url";
import { COVER_ASPECT_CLASS } from "@/lib/image";
import { formatOutfitTitle } from "@/lib/outfit";
import FavoriteButton from "./FavoriteButton";
import ItemTypeBadges from "./ItemTypeBadges";
import { saveHomeScroll } from "@/lib/home-scroll";

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
    <Link
      href={`/outfit/${id}`}
      onClick={() => saveHomeScroll(window.scrollY)}
      className="group block min-w-0 overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        ref={imageRef}
        className={`relative w-full overflow-hidden bg-neutral-100 ${COVER_ASPECT_CLASS}`}
      >
        {inView ? (
          <Image
            src={assetUrl(mainImage)}
            alt={displayTitle}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : null}
        <div className="absolute right-2 top-2">
          <FavoriteButton type="outfit" targetId={id} />
        </div>
      </div>
      <div className="space-y-1.5 p-2.5 sm:p-3">
        <p className="break-words text-sm font-medium text-neutral-900 line-clamp-2">
          {displayTitle}
        </p>
        <ItemTypeBadges types={itemTypes} />
      </div>
    </Link>
  );
}
