import Image from "next/image";

export default function ItemImagePreview({
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
      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-100 ${className}`}
    >
      {src.startsWith("blob:") ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={64}
          height={64}
          className="h-16 w-16 object-cover"
          sizes="64px"
        />
      )}
    </div>
  );
}
