import Image from "next/image";
import { assetUrl } from "@/lib/asset-url";
import { cdnImageProps } from "@/lib/remote-image";

export default function ItemImagePreview({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const resolvedSrc = src.startsWith("blob:") ? src : assetUrl(src);

  return (
    <div
      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-100 ${className}`}
    >
      {src.startsWith("blob:") ? (
        <img src={resolvedSrc} alt={alt} className="h-full w-full object-contain" />
      ) : (
        <Image
          src={resolvedSrc}
          alt={alt}
          width={64}
          height={64}
          className="h-16 w-16 object-contain"
          sizes="64px"
          {...cdnImageProps()}
        />
      )}
    </div>
  );
}
