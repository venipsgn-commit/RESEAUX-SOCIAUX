import { Shell } from './Shell';

function Bar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-ink-900/[0.06] ${className}`} />;
}

/** Squelette générique d'un fil de posts (voisinage, marché…) */
export function FeedSkeleton() {
  return (
    <Shell>
      <div className="max-w-2xl mx-auto px-4 pt-6 lg:pt-10 space-y-4">
        <Bar className="h-8 w-40" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bar key={i} className="h-16 w-16 rounded-full flex-shrink-0" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-3xl border border-ink-900/5 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Bar className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Bar className="h-3.5 w-1/3" />
                <Bar className="h-3 w-1/4" />
              </div>
            </div>
            <Bar className="h-40 w-full rounded-2xl" />
            <Bar className="h-3.5 w-2/3" />
          </div>
        ))}
      </div>
    </Shell>
  );
}

/** Squelette d'une grille (marché, profil) */
export function GridSkeleton() {
  return (
    <Shell>
      <div className="max-w-4xl mx-auto px-4 pt-6 lg:pt-10 space-y-4">
        <Bar className="h-8 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bar className="aspect-square w-full rounded-2xl" />
              <Bar className="h-3.5 w-3/4" />
              <Bar className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/** Squelette plein écran (carte) : un simple voile qui laisse deviner la carte */
export function MapSkeleton() {
  return (
    <Shell>
      <div className="relative h-[calc(100dvh-88px)] lg:h-screen overflow-hidden bg-[#e8e6e1]">
        <div className="absolute top-3 left-3 right-3 lg:top-6 lg:left-6 lg:right-auto lg:w-96 flex gap-2">
          <Bar className="h-12 flex-1 rounded-full" />
          <Bar className="h-11 w-11 rounded-full" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Bar className="h-64 w-64 rounded-full opacity-60" />
        </div>
      </div>
    </Shell>
  );
}

/** Squelette liste (messages, notifications) */
export function ListSkeleton() {
  return (
    <Shell>
      <div className="max-w-2xl mx-auto px-4 pt-6 lg:pt-10 space-y-3">
        <Bar className="h-8 w-40 mb-2" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-ink-900/5">
            <Bar className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Bar className="h-3.5 w-1/3" />
              <Bar className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
