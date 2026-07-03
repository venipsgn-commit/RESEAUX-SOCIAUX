import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { createClient } from '@/lib/supabase/server';
import { getServerPosition } from '@/lib/getServerPosition';
import { DEFAULT_RADIUS_M } from '@/lib/location';
import {
  type NearbyPost,
  POST_TYPE_META,
  formatDistance,
  formatPrice,
  timeAgo,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

function PostCard({ post }: { post: NearbyPost }) {
  const meta = POST_TYPE_META[post.type];
  const price = formatPrice(post.price_cents);

  return (
    <article className="bg-white rounded-3xl overflow-hidden border border-ink-900/5 shadow-soft">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-lg shadow-pin">
          {post.author_avatar_emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm">{post.author_handle}</span>
            <span className={`chip ${meta.chipClass}`}>{meta.label}</span>
          </div>
          <div className="text-[11px] text-ink-700/55">
            Score <b className="text-forest-600">{post.author_neighbor_score}</b> · à{' '}
            <b>{formatDistance(post.distance_m)}</b> · {timeAgo(post.created_at)}
          </div>
        </div>
      </div>

      <div
        className="aspect-square flex flex-col items-center justify-center text-[120px] relative"
        style={{ background: meta.gradient }}
      >
        {post.type === 'geolock' ? (
          <>
            <div className="text-7xl opacity-50">🔒</div>
            <p className="hand text-2xl text-ink-900 max-w-[260px] text-center leading-tight mt-2 px-4">
              &quot;{post.body}&quot;
            </p>
            {post.geolock_hint && (
              <div className="mt-3 px-3 py-1.5 bg-ink-900/85 backdrop-blur rounded-full text-white text-[11px] font-bold">
                📍 {post.geolock_hint}
              </div>
            )}
          </>
        ) : (
          <span>{post.emoji}</span>
        )}
        <div className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded-full text-[10px] font-bold text-ink-900">
          🚶 {formatDistance(post.distance_m)}
        </div>
        {price && (
          <div className="absolute bottom-3.5 left-3.5 bg-white/95 backdrop-blur px-3.5 py-2 rounded-2xl">
            <div className="text-2xl font-black leading-none text-ink-900">{price}</div>
          </div>
        )}
        {post.event_at && (
          <div className="absolute bottom-3 right-3 bg-ink-900 text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
            🗓{' '}
            {new Date(post.event_at).toLocaleString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>

      <div className="px-4 pt-3 flex gap-4 items-center text-2xl">
        <button aria-label="J'aime">♡</button>
        <button aria-label="Commenter" className="text-xl">💬</button>
        <button aria-label="Partager" className="text-xl">↗</button>
        <div className="flex-1" />
        <button aria-label="Enregistrer" className="text-xl">🔖</button>
      </div>
      <div className="px-4 pb-4 pt-2">
        <p className="text-sm">
          <b>{post.author_handle}</b> {post.title}
        </p>
        {post.type !== 'geolock' && post.body && (
          <p className="text-sm text-ink-700/70 mt-0.5">{post.body}</p>
        )}
        {post.type === 'sell' && (
          <>
            <button className="mt-3 w-full py-2.5 bg-gradient-to-br from-forest-400 to-forest-600 text-white rounded-full font-extrabold text-sm shadow-soft">
              Acheter en escrow
            </button>
            <div className="text-[10px] text-center text-ink-700/40 mt-2">
              Commission 8% · payé seulement après livraison
            </div>
          </>
        )}
        {post.type === 'service' && (
          <button className="mt-2 px-3 py-1.5 bg-coral-500 text-white rounded-full text-xs font-bold shadow-soft">
            📅 Réserver
          </button>
        )}
        {post.type === 'event' && (
          <button className="mt-2 w-full py-2.5 bg-sunset-500 text-white rounded-full font-extrabold text-sm shadow-soft">
            Je viens 🙋
          </button>
        )}
        {post.type === 'geolock' && (
          <button className="mt-2 w-full py-2.5 bg-gradient-to-br from-lilac-300 to-lilac-500 text-white rounded-full font-extrabold text-sm shadow-soft">
            🚶 M&apos;y rendre pour débloquer
          </button>
        )}
      </div>
    </article>
  );
}

export default async function VoisinagePage() {
  const supabase = createClient();
  const pos = getServerPosition();

  const [{ data: posts }, { data: userData }] = await Promise.all([
    supabase.rpc('posts_nearby', {
      user_lat: pos.lat,
      user_lng: pos.lng,
      radius_m: DEFAULT_RADIUS_M,
      max_results: 50,
    }),
    supabase.auth.getUser(),
  ]);

  const nearbyPosts = (posts ?? []) as NearbyPost[];
  const user = userData?.user ?? null;

  // Voisins uniques pour la barre de stories
  const seen = new Set<string>();
  const neighbors = nearbyPosts.filter((p) => {
    if (seen.has(p.author_id)) return false;
    seen.add(p.author_id);
    return true;
  });

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 pt-3 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="aura-logo" />
              <span className="text-xl font-black tracking-tight">aura</span>
              <span className="text-[11px] text-ink-700/50 font-semibold">
                · {pos.quartier.split(' · ')[0]}
              </span>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-4xl font-black tracking-tight">Voisinage</h1>
              <p className="text-sm text-ink-700/60 mt-0.5">
                {pos.real ? '📍' : '🧭'} {pos.quartier} · {neighbors.length} voisins actifs dans ton
                aura
              </p>
            </div>
            <div className="flex gap-3 items-center">
              {!user && (
                <Link
                  href="/connexion"
                  className="px-4 py-2 bg-ink-900 text-cream-50 rounded-full text-xs font-bold shadow-soft"
                >
                  Rejoindre
                </Link>
              )}
              <button aria-label="Likes" className="text-xl">❤️</button>
              <button aria-label="Messages" className="text-xl">💬</button>
            </div>
          </div>

          {/* STORIES — voisins actifs, triés par distance */}
          <div className="overflow-x-auto -mx-1">
            <div className="flex gap-2.5 px-1 pb-1">
              <div className="text-center flex-shrink-0 w-16">
                <Link href={user ? '/compose' : '/connexion'}>
                  <div
                    className="story-ring"
                    style={{ padding: 0, background: 'transparent', border: '2px dashed rgba(31,26,18,0.2)' }}
                  >
                    <div
                      className="story-ring-inner"
                      style={{ background: 'transparent', fontSize: 24, color: 'rgba(31,26,18,0.4)' }}
                    >
                      ＋
                    </div>
                  </div>
                </Link>
                <div className="text-[10px] mt-1 font-bold text-ink-700/70">Toi</div>
              </div>
              {neighbors.map((n, i) => (
                <div key={n.author_id} className="text-center flex-shrink-0 w-16">
                  <div className={`story-ring ${i === 0 ? 'story-ring-merged' : ''}`}>
                    <div className="story-ring-inner">{n.author_avatar_emoji}</div>
                  </div>
                  <div
                    className={`text-[10px] mt-1 font-bold truncate ${
                      i === 0 ? 'text-sunset-500' : 'text-ink-700/70'
                    }`}
                  >
                    {n.author_handle} · {formatDistance(n.distance_m)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="px-3 lg:px-8 py-4 space-y-4">
          {nearbyPosts.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🏜️</div>
              <p className="font-bold">Aucune activité dans ton aura pour l&apos;instant.</p>
              <p className="text-sm text-ink-700/60 mt-1">
                {pos.real
                  ? 'Ton aura est calme — sois le premier à publier ! (Les voisins de démo sont autour de Bastille, Paris.)'
                  : 'Sois le premier à publier quelque chose dans ton quartier !'}
              </p>
              <Link
                href={user ? '/compose' : '/connexion'}
                className="inline-block mt-4 px-5 py-2.5 bg-ink-900 text-cream-50 rounded-full text-sm font-bold shadow-soft"
              >
                ＋ Publier
              </Link>
            </div>
          )}

          {nearbyPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {nearbyPosts.length > 0 && (
            <div className="text-center py-6 text-[11px] text-ink-700/40">
              Tu as vu toutes les nouveautés du quartier ✨
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
