export default function ItemDetailSkeleton() {
  return (
    <div className="min-w-0 animate-pulse">
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div className="mx-auto h-[200px] w-full max-w-[200px] shrink-0 rounded-xl bg-neutral-200 sm:mx-0 sm:h-[180px] sm:w-[180px] sm:max-w-none" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-4 w-16 rounded bg-neutral-200" />
          <div className="h-6 w-3/4 max-w-sm rounded bg-neutral-200" />
          <div className="h-4 w-28 rounded bg-neutral-200" />
        </div>
      </div>
      <div className="mt-6 border-t border-border pt-5">
        <div className="h-5 w-24 rounded bg-neutral-200" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-neutral-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
