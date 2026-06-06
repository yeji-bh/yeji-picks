import Image from "next/image";

const PREVIEW_CLASS =
  "block max-h-[280px] max-w-[200px] h-auto w-auto object-contain";

export default function CoverImagePreview({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex max-w-[200px] items-center justify-center overflow-hidden rounded-lg border border-border bg-neutral-100 p-1 ${className}`}
    >
      {src.startsWith("blob:") ? (
        <img src={src} alt={alt} className={PREVIEW_CLASS} />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={200}
          height={280}
          className={PREVIEW_CLASS}
          sizes="200px"
          unoptimized
        />
      )}
    </div>
  );
}
