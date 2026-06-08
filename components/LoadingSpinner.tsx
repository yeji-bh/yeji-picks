"use client";

export default function LoadingSpinner({
  label,
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2 text-sm text-muted ${className}`}>
      <span
        aria-hidden
        className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700"
      />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
