'use client';

import { useState } from 'react';
import { LiveMap, type MapPost, type MapPerson } from './LiveMap';

const FILTERS = [
  { key: 'all', label: 'Tout', icon: '✨' },
  { key: 'sell', label: 'Vendre', icon: '🛒' },
  { key: 'service', label: 'Service', icon: '🛠' },
  { key: 'event', label: 'Event', icon: '🎉' },
  { key: 'people', label: 'Voisins', icon: '👥' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

export function MapView({
  center,
  radiusM,
  posts,
  people,
}: {
  center: { lat: number; lng: number };
  radiusM: number;
  posts: MapPost[];
  people: MapPerson[];
}) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const shownPosts =
    filter === 'all' ? posts : filter === 'people' ? [] : posts.filter((p) => p.type === filter);
  const shownPeople = filter === 'all' || filter === 'people' ? people : [];

  return (
    <>
      <LiveMap
        className="absolute inset-0"
        center={center}
        radiusM={radiusM}
        posts={shownPosts}
        people={shownPeople}
      />

      {/* Menu de filtres (défilable horizontalement) */}
      <div className="absolute top-16 lg:top-20 left-0 right-0 z-30 px-3 lg:px-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <div className="flex gap-1.5 pb-1">
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={
                  on
                    ? 'bg-ink-900 text-cream-50 text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-pin active:scale-95 transition'
                    : 'bg-cream-50/95 backdrop-blur-xl text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-soft text-ink-900 active:scale-95 transition'
                }
              >
                {f.icon} {f.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
