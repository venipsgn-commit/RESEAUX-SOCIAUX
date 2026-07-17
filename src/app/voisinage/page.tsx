import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { NotifBell } from '@/components/NotifBell';
import { MessagesBadge } from '@/components/MessagesBadge';
import { InvitationsButton } from '@/components/InvitationsButton';
import { NavIcon } from '@/components/NavIcons';
import { Stories } from '@/components/Stories';
import { ReactionBar } from '@/components/ReactionBar';
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

function PostCard({ post, likedByMe }: { post: NearbyPost; likedByMe: boolean }) {
  const meta = POST_TYPE_META[post.type];
  const price = formatPrice(post.price_cents);
  const hasImage = Boolean(post.image_url) && post.type !== 'geolock';
  const hasCta =
    post.type === 'sell' || post.type === 'service' || post.type === 'event' || post.type === 'geolock';

  return (
    <article className="bg-white rounded-2xl overflow-hidden border border-ink-900/5 shadow-soft">
      {/* EN-TÊTE — façon Facebook */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-center gap-2.5">
        <Link href={`/u/${post.author_handle}`} className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-lg shadow-pin overflow-hidden">
            {post.author_avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.author_avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              post.author_avatar_emoji
            )}
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-forest-500 rounded-full border-2 border-white" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link href={`/u/${post.author_handle}`} className="font-bold text-[15px] leading-tight truncate">
              {post.author_handle}
            </Link>
            <span className={`chip ${meta.chipClass} flex-shrink-0`}>{meta.label}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-ink-700/55 mt-0.5">
            <span>{timeAgo(post.created_at)}</span>
            <span className="w-0.5 h-0.5 rounded-full bg-ink-700/40" />
            <span>📍 {formatDistance(post.distance_m)}</span>
            <span className="w-0.5 h-0.5 rounded-full bg-ink-700/40" />
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-70"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
        </div>
        <button
          aria-label="Options"
          className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-ink-700/45 active:bg-ink-900/5 transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="5" cy="12" r="1.7" />
            <circle cx="12" cy="12" r="1.7" />
            <circle cx="19" cy="12" r="1.7" />
          </svg>
        </button>
      </div>

      {/* TEXTE — au-dessus de l'image, comme un statut Facebook */}
      {post.type !== 'geolock' && (post.title || post.body) && (
        <Link href={`/post/${post.id}`} className="block px-4 pb-2.5">
          <p className="text-[15px] leading-snug text-ink-900 line-clamp-3">
            <span className="font-bold">{post.title}</span>
            {post.body && (
              <span className="text-ink-900/85">
                {post.title ? ' · ' : ''}
                {post.body}
              </span>
            )}
          </p>
        </Link>
      )}

      {/* VISUEL — pleine largeur */}
      <Link
        href={`/post/${post.id}`}
        className="block aspect-square relative"
        style={hasImage ? undefined : { background: meta.gradient }}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image_url!} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[120px]">
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
          </div>
        )}
        {price && (
          <div className="absolute bottom-3.5 left-3.5 bg-white/95 backdrop-blur px-3.5 py-2 rounded-2xl shadow-soft">
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
      </Link>

      {/* CTA spécifique au type d'annonce */}
      {hasCta && (
        <div className="px-4 pt-3">
          {post.type === 'sell' && (
            <Link
              href={`/post/${post.id}`}
              className="block text-center w-full py-2.5 bg-gradient-to-br from-forest-400 to-forest-600 text-white rounded-full font-extrabold text-sm shadow-soft"
            >
              Acheter en escrow
            </Link>
          )}
          {post.type === 'service' && (
            <Link
              href={`/post/${post.id}`}
              className="inline-block px-3 py-1.5 bg-coral-500 text-white rounded-full text-xs font-bold shadow-soft"
            >
              📅 Réserver
            </Link>
          )}
          {post.type === 'event' && (
            <Link
              href={`/post/${post.id}`}
              className="block text-center w-full py-2.5 bg-sunset-500 text-white rounded-full font-extrabold text-sm shadow-soft"
            >
              Je viens 🙋
            </Link>
          )}
          {post.type === 'geolock' && (
            <Link
              href={`/post/${post.id}`}
              className="block text-center w-full py-2.5 bg-gradient-to-br from-lilac-300 to-lilac-500 text-white rounded-full font-extrabold text-sm shadow-soft"
            >
              🚶 M&apos;y rendre pour débloquer
            </Link>
          )}
        </div>
      )}

      {/* PIED — résumé + J'aime / Commenter / Partager */}
      <ReactionBar
        variant="facebook"
        postId={post.id}
        initialLiked={likedByMe}
        initialSaved={false}
        initialLikeCount={post.like_count}
        shareTitle={post.title}
      />
    </article>
  );
}

export default async function VoisinagePage() {
  const supabase = createClient();
  const pos = getServerPosition();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rayon = aura de l'utilisateur (réglable dans le profil), sinon défaut.
  let radius = DEFAULT_RADIUS_M;
  if (user) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('aura_radius_m')
      .eq('id', user.id)
      .single();
    if (prof?.aura_radius_m) radius = prof.aura_radius_m;
  }

  const { data: posts } = await supabase.rpc('posts_nearby', {
    user_lat: pos.lat,
    user_lng: pos.lng,
    radius_m: radius,
    max_results: 50,
  });

  const nearbyPosts = (posts ?? []) as NearbyPost[];

  // Posts déjà likés par l'utilisateur (pour préremplir les cœurs)
  let likedIds = new Set<string>();
  if (user && nearbyPosts.length > 0) {
    const { data: myLikes } = await supabase
      .from('reactions')
      .select('post_id')
      .eq('user_id', user.id)
      .eq('kind', 'like')
      .in(
        'post_id',
        nearbyPosts.map((p) => p.id),
      );
    likedIds = new Set((myLikes ?? []).map((r) => r.post_id as string));
  }

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
              <Link
                href="/recherche"
                aria-label="Rechercher"
                className="relative flex items-center justify-center text-ink-900"
              >
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </Link>
              <Link
                href="/voisins"
                aria-label="Découvrir mes voisins"
                className="relative flex items-center justify-center text-ink-900"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </Link>
              <InvitationsButton />
              <NotifBell />
              <Link
                href="/messages"
                aria-label="Messages"
                className="relative flex items-center justify-center text-ink-900"
              >
                <NavIcon name="messages" size={24} />
                <MessagesBadge />
              </Link>
            </div>
          </div>

          {/* STORIES — façon Instagram (ajouter / lire les stories des voisins) */}
          <Stories lat={pos.lat} lng={pos.lng} radius={radius} />
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
            <PostCard key={post.id} post={post} likedByMe={likedIds.has(post.id)} />
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
