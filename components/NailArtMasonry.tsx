"use client";

const MASONRY_CLASS =
  "columns-2 gap-x-3 sm:columns-3 sm:gap-x-4 lg:columns-4 [&>*]:mb-3 sm:[&>*]:mb-4";

export default function NailArtMasonry({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={MASONRY_CLASS}>{children}</div>;
}

export { MASONRY_CLASS };
