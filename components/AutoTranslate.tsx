"use client";

/** Renders text as-is. User content is not auto-translated. */
export default function AutoTranslate({
  text,
  className,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  as?: "span" | "p";
}) {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) return null;
  return <Tag className={className}>{trimmed}</Tag>;
}
