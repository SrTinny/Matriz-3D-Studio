import Skeleton from './Skeleton';

export default function HomePageSkeleton() {
  return (
    <main className="mx-auto max-w-screen-xl p-6 space-y-6" aria-busy="true" aria-live="polite">
      <section className="card p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
          <Skeleton className="h-56 md:h-64 w-full rounded-2xl" />
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-3 space-y-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </section>

      <section className="card p-4 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
      </section>

      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <section key={sectionIndex} className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-24" />
          </div>
          <ul className="grid gap-3 auto-rows-fr grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((__, cardIndex) => (
              <li key={cardIndex} className="card p-1 sm:p-2 md:p-3 flex flex-col gap-2 h-full">
                <Skeleton className="relative w-full aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3] xl:aspect-[3/2] 2xl:aspect-[4/3]" />
                <div className="flex-1 min-h-10 md:min-h-12 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <div className="flex items-center justify-center flex-col gap-2 w-full">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
