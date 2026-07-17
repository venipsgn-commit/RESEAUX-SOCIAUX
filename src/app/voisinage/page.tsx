import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { NotifBell } from '@/components/NotifBell';
import { MessagesBadge } from '@/components/MessagesBadge';
import { InvitationsButton } from '@/components/InvitationsButton';
import { NavIcon } from '@/components/NavIcons';
import { Stories } from '@/components/Stories';
import { createClient } from '@/lib/supabase/server';
import { getServerPosition } from '@/lib/getServerPosition';
import { DEFAULT_RADIUS_M } from '@/lib/location';
import { type NearbyPost } from '@/lib/types';
import { InfiniteFeed } from '@/components/InfiniteFeed';

export const dynamic = 'force-dynamic';

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
              <span className="text-xl font-black tracking-tight">AURA</span>
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

          <InfiniteFeed
            initialPosts={nearbyPosts}
            initialLiked={[...likedIds]}
            lat={pos.lat}
            lng={pos.lng}
            radius={radius}
          />

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
