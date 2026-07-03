import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { createClient } from '@/lib/supabase/server';
import { getServerPosition } from '@/lib/getServerPosition';
import { DEFAULT_RADIUS_M } from '@/lib/location';
import { type NearbyPost, POST_TYPE_META, formatDistance, formatPrice } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function MarchePage() {
  const supabase = createClient();
  const pos = getServerPosition();

  const { data } = await supabase.rpc('posts_nearby', {
    user_lat: pos.lat,
    user_lng: pos.lng,
    radius_m: DEFAULT_RADIUS_M,
    max_results: 100,
  });

  const items = ((data ?? []) as NearbyPost[]).filter(
    (p) => p.type === 'sell' || p.type === 'service',
  );

  return (
    <Shell>
      <div className="max-w-5xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 pt-3 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] text-ink-700/50 font-bold uppercase tracking-wider">
                📍 Aura · {DEFAULT_RADIUS_M}m
              </div>
              <h1 className="text-2xl lg:text-4xl font-black tracking-tight">Marché du quartier</h1>
              <p className="hidden lg:block text-sm text-ink-700/60 mt-1">
                {items.length} trésors à 5 minutes à pied
              </p>
            </div>
            <button
              aria-label="Rechercher"
              className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center"
            >
              🔍
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              `Tout · ${items.length}`,
              `🛒 Objets · ${items.filter((i) => i.type === 'sell').length}`,
              `🛠 Services · ${items.filter((i) => i.type === 'service').length}`,
            ].map((c, i) => (
              <button
                key={c}
                className={
                  i === 0
                    ? 'bg-ink-900 text-cream-50 text-xs font-bold px-3 py-2 rounded-full whitespace-nowrap shadow-pin'
                    : 'bg-sand-100 text-ink-900 text-xs font-bold px-3 py-2 rounded-full whitespace-nowrap'
                }
              >
                {c}
              </button>
            ))}
          </div>
        </header>

        <div className="px-3 lg:px-8 py-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🛒</div>
              <p className="font-bold">Rien à vendre dans ton aura pour l&apos;instant.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/post/${item.id}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-soft border border-ink-900/5 hover:shadow-lift transition cursor-pointer"
                >
                  <div
                    className="aspect-square flex items-center justify-center text-[80px] relative"
                    style={item.image_url ? undefined : { background: POST_TYPE_META[item.type].gradient }}
                  >
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      item.emoji
                    )}
                    <div className="absolute top-2 left-2 bg-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                      🚶 {formatDistance(item.distance_m)}
                    </div>
                    {item.type === 'service' && (
                      <div className="absolute top-2 right-2 bg-coral-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Service
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-xl font-black">{formatPrice(item.price_cents) ?? '—'}</div>
                    <div className="text-xs font-bold text-ink-700/80 truncate">{item.title}</div>
                    <div className="text-[10px] text-ink-700/50 mt-0.5">@{item.author_handle}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
