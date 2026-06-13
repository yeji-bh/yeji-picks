import { COVER_ASPECT_CLASS } from "@/lib/image";
import { HOME_INITIAL_RENDER } from "@/lib/home-pagination";

export default function HomeGridSkeleton({
  count = HOME_INITIAL_RENDER,
}: {
  count?: number;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: count }, (_, index) => (
        <article key={index} className="min-w-0 animate-pulse">
          <div
            className={`w-full bg-neutral-200 dark:bg-neutral-700 ${COVER_ASPECT_CLASS}`}
          />
          <div className="mt-2.5 space-y-2">
            <div className="h-4 w-4/5 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-3 w-3/5 rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </article>
      ))}
    </div>
  );
}
