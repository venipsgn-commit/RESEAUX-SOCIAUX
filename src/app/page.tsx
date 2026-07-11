import { Shell } from '@/components/Shell';
import { LiveMap, type MapPost, type MapPerson } from '@/components/LiveMap';
import { NotifBell } from '@/components/NotifBell';
import { PresenceBeacon } from '@/components/PresenceBeacon';
import { createClient } from '@/lib/supabase/server';
import { getServerPosition } from '@/lib/getServerPosition';
import { DEFAULT_RADIUS_M } from '@/lib/location';
import { type NearbyPost, formatDistance } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const supabase = createClient();
  const pos = getServerPosition();

  const [{ data }, { data: peopleData }] = await Promise.all([
    supabase.rpc('posts_nearby', {
      user_lat: pos.lat,
      user_lng: pos.lng,
      radius_m: DEFAULT_RADIUS_M,
      max_results: 50,
    }),
    supabase.rpc('people_nearby', {
      user_lat: pos.lat,
      user_lng: pos.lng,
      radius_m: DEFAULT_RADIUS_M,
    }),
  ]);
  const posts = (data ?? []) as NearbyPost[];
  const nearest = posts[0] ?? null;
  const neighborCount = new Set(posts.map((p) => p.author_id)).size;

  const mapPosts: MapPost[] = posts.map((p) => ({
    id: p.id,
    type: p.type,
    emoji: p.emoji,
    title: p.title,
    lat: p.lat,
    lng: p.lng,
  }));

  const people = (peopleData ?? []) as MapPerson[];

  return (
    <Shell>
      <div className="relative h-[calc(100dvh-88px)] lg:h-screen overflow-hidden">
        <LiveMap
          className="absolute inset-0"
          center={{ lat: pos.lat, lng: pos.lng }}
          radiusM={DEFAULT_RADIUS_M}
          posts={mapPosts}
          people={people}
        />

        {/* Présence live : voisins en ligne + aura tangente */}
        <PresenceBeacon />

        {/* TOP — location bar */}
        <div className="absolute top-3 left-3 right-3 lg:top-6 lg:left-6 lg:right-auto lg:w-96 z-30 flex gap-2 items-center animate-fade-up">
          <div className="bg-cream-50/95 backdrop-blur-xl rounded-full px-3 py-2 flex-1 flex items-center gap-2.5 shadow-soft">
            <span className="text-base">{pos.real ? '📍' : '🧭'}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] uppercase tracking-wider font-bold text-ink-700/50">
                {pos.real ? 'Tu es à' : 'Aperçu · démo'}
              </div>
              <div className="text-sm font-extrabold leading-tight truncate">{pos.quartier}</div>
            </div>
            <span className="text-xs text-ink-700/60 font-bold">▼</span>
          </div>
          <NotifBell variant="floating" />
        </div>

        {/* FILTERS */}
        <div className="absolute top-16 lg:top-20 left-0 right-0 z-30 px-3 lg:px-6 overflow-x-auto">
          <div className="flex gap-1.5 pb-1">
            {['✨ Tout', '🛒 Vendre', '🛠 Service', '🎉 Event', '👥 Voisins', '🏪 Commerces'].map((f, i) => (
              <button
                key={f}
                className={
                  i === 0
                    ? 'bg-ink-900 text-cream-50 text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-pin'
                    : 'bg-cream-50/95 backdrop-blur-xl text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-soft text-ink-900'
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* BOTTOM SHEET — voisin le plus proche (données réelles) */}
        {nearest ? (
          <div className="absolute bottom-3 left-3 right-3 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96 z-30">
            <div className="bg-cream-50/97 backdrop-blur-xl rounded-3xl p-3.5 shadow-lift border border-sunset-500/30 animate-fade-up">
              <div className="text-[10px] uppercase tracking-wider font-bold text-ink-700/50 mb-2 px-1">
                {neighborCount} voisins · {posts.length} posts dans ton aura
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lilac-400 to-lilac-500 flex items-center justify-center text-2xl border-2 border-white shadow-pin flex-shrink-0">
                  {nearest.author_avatar_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-extrabold text-sm">{nearest.author_handle}</span>
                    <span className="badge-merge">Le plus proche</span>
                  </div>
                  <div className="text-[11px] text-ink-700/60 truncate">
                    {nearest.title} · à <b>{formatDistance(nearest.distance_m)}</b> · Score{' '}
                    <b className="text-forest-600">{nearest.author_neighbor_score}</b>
                  </div>
                </div>
                <button className="px-3 py-2 bg-ink-900 text-cream-50 rounded-full text-xs font-bold shadow-soft">
                  👋 Saluer
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-3 left-3 right-3 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96 z-30">
            <div className="bg-cream-50/97 backdrop-blur-xl rounded-3xl p-4 shadow-lift text-center animate-fade-up">
              <div className="text-sm font-bold">Ton aura est calme 🍃</div>
              <div className="text-[11px] text-ink-700/60 mt-0.5">
                Aucun voisin dans 500m. Les voisins de démo sont autour de Bastille.
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
