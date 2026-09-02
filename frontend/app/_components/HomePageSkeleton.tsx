import Skeleton from './Skeleton';

export default function HomePageSkeleton() {
  return (
    <main className="mx-auto max-w-screen-xl p-4 md:p-6 space-y-5" aria-busy="true" aria-live="polite">
      <section className="card p-4 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <Skeleton className="h-40 md:h-48 w-full rounded-2xl" />
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-3 space-y-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-20" />
        </div>
        <ul className="grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <li key={index} className="card p-2 flex flex-col gap-2">
              <Skeleton className="relative w-full aspect-[4/3] rounded-lg" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-24" />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
