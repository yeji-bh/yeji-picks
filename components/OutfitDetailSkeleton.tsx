export default function OutfitDetailSkeleton() {
  return (
    <div className="min-w-0 animate-pulse">
      <div className="border-b border-border pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="h-6 w-40 rounded bg-neutral-200" />
          <div className="h-8 w-16 rounded-lg bg-neutral-200" />
        </div>
      </div>
      <div className="mt-4 grid gap-8 lg:mt-6 lg:grid-cols-[clamp(260px,24.74vw,475px)_minmax(0,1fr)] lg:gap-x-12">
        <div className="aspect-[3/4] w-full rounded-xl bg-neutral-200 lg:max-w-[475px]" />
        <div className="space-y-4">
          <div className="h-5 w-12 rounded bg-neutral-200" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-24 w-24 shrink-0 rounded-lg bg-neutral-200" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-3 w-16 rounded bg-neutral-200" />
                <div className="h-4 w-32 rounded bg-neutral-200" />
                <div className="h-4 w-48 rounded bg-neutral-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
