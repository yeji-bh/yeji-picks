import Image from "next/image";
import { assetUrl } from "@/lib/asset-url";
import { cdnImageProps } from "@/lib/remote-image";

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
  const resolvedSrc = src.startsWith("blob:") ? src : assetUrl(src);
  const cdn = cdnImageProps({ unoptimized: true });

  return (
    <div
      className={`inline-flex max-w-[200px] items-center justify-center overflow-hidden rounded-lg border border-border bg-neutral-100 p-1 ${className}`}
    >
      {src.startsWith("blob:") ? (
        <img src={resolvedSrc} alt={alt} className={PREVIEW_CLASS} />
      ) : (
        <Image
          src={resolvedSrc}
          alt={alt}
          width={200}
          height={280}
          className={PREVIEW_CLASS}
          sizes="200px"
          unoptimized={cdn.unoptimized ?? true}
        />
      )}
    </div>
  );
}
