import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { LogoutButton } from '@/components/LogoutButton';
import { ProfileStats } from '@/components/ProfileStats';
import { InvitationList } from '@/components/InvitationList';
import { createClient } from '@/lib/supabase/server';
import { type Profile, POST_TYPE_META, type PostType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Pas connecté ──────────────────────────────────────────────
  if (!user) {
    return (
      <Shell>
        <div className="max-w-md mx-auto px-4 pt-24 lg:pt-40 text-center">
          <div className="relative w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center mb-4 shadow-lift">
            <div className="absolute inset-0 rounded-full bg-forest-400 animate-ping-slow opacity-30" />
            <div className="relative w-4 h-4 rounded-full bg-white" />
          </div>
          <h1 className="text-2xl font-black">Ton profil t&apos;attend.</h1>
          <p className="text-sm text-ink-700/60 mt-2">
            Crée ton compte pour rejoindre ton quartier, vendre, proposer tes services et
            rencontrer tes voisins.
          </p>
          <Link
            href="/connexion"
            className="inline-block mt-6 px-8 py-3.5 bg-ink-900 text-cream-50 rounded-full font-extrabold text-sm shadow-lift"
          >
            📍 Activer mon AURA
          </Link>
        </div>
      </Shell>
    );
  }

  // ── Connecté : vraies données ─────────────────────────────────
  const [{ data: profileData }, { data: myPosts }, { data: statsData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('posts')
      .select('id, type, emoji, title, status, image_url')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.rpc('profile_stats', { uid: user.id }),
  ]);

  const profile = profileData as Profile | null;
  const posts = myPosts ?? [];
  const stats = (statsData?.[0] ?? { followers: 0, following: 0, posts: posts.length }) as {
    followers: number;
    following: number;
    posts: number;
  };
  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '…';

  return (
    <Shell>
      <div className="max-w-3xl mx-auto pb-10">
        {/* ── COUVERTURE ─────────────────────────────────────────── */}
        <div className="relative h-36 lg:h-52 bg-gradient-to-br from-forest-400 via-forest-500 to-forest-600 overflow-hidden">
          {/* Anneaux « aura » décoratifs */}
          <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full border border-white/15" />
          <div className="absolute -top-8 -right-2 w-40 h-40 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -left-10 w-56 h-56 rounded-full border border-white/10" />
          <div className="absolute top-3 right-3 lg:top-4 lg:right-4">
            <LogoutButton />
          </div>
        </div>

        {/* ── EN-TÊTE PROFIL ─────────────────────────────────────── */}
        <div className="px-4 lg:px-8 -mt-14">
          <div className="relative w-28 h-28 lg:w-32 lg:h-32">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-6xl lg:text-7xl shadow-lift border-4 border-cream-50">
              {profile?.avatar_emoji ?? '📍'}
            </div>
            <div className="absolute bottom-1 right-1 bg-forest-500 text-white w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-[3px] border-cream-50 shadow-pin">
              {profile?.neighbor_score ?? 50}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                {profile?.display_name ?? profile?.handle ?? '…'}
              </h1>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#3f9e5c" aria-label="Vérifié">
                <path d="M12 2l2.4 1.8 3 .3 1 2.8 2.3 1.9-.9 2.9.9 2.9-2.3 1.9-1 2.8-3 .3L12 22l-2.4-1.8-3-.3-1-2.8L3.3 15l.9-2.9L3.3 9.2l2.3-1.9 1-2.8 3-.3z" />
                <path d="M9.5 12.5l1.8 1.8 3.5-3.8" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-sm text-ink-700/55 font-semibold">@{profile?.handle ?? '…'}</div>

            {/* Bio / tagline */}
            {profile?.bio && <p className="text-sm text-ink-900/85 mt-2">{profile.bio}</p>}
            {profile?.tagline && (
              <p className="hand text-lg text-coral-500 -mt-0.5">&quot;{profile.tagline}&quot;</p>
            )}

            {/* Détails façon Facebook */}
            <div className="mt-2.5 space-y-1.5 text-sm text-ink-700/75">
              <div className="flex items-center gap-2.5">
                <span className="w-5 text-center">📍</span>
                <span>{profile?.quartier ?? 'Quartier non défini'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 text-center">📡</span>
                <span>
                  Aura de <b className="text-forest-600">{profile?.aura_radius_m ?? 500} m</b>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 text-center">🗓️</span>
                <span>Membre depuis {memberSince}</span>
              </div>
            </div>
          </div>

          {/* Stats cliquables */}
          <div className="mt-4 bg-white rounded-2xl p-2 shadow-soft border border-ink-900/5">
            <ProfileStats posts={stats.posts} followers={stats.followers} following={stats.following} />
          </div>

          {/* Emplacement des listes abonnés/abonnements (dépliées au clic) */}
          <div id="profile-lists" className="mt-3" />

          {/* Boutons d'action */}
          <div className="flex gap-2.5 mt-4">
            <Link
              href="/compose"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-br from-forest-400 to-forest-600 text-white rounded-full font-extrabold text-sm shadow-soft"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Publier
            </Link>
            <Link
              href="/voisinage"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sand-200 text-ink-900 rounded-full font-extrabold text-sm shadow-soft"
            >
              📸 Ma story
            </Link>
            <Link
              href="/invitations"
              aria-label="Invitations"
              className="w-11 flex items-center justify-center bg-sand-200 text-ink-900 rounded-full shadow-soft"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="px-4 lg:px-8 mt-5 space-y-4">
          {/* Invitations reçues (Accepter / Refuser) */}
          <InvitationList />

          {/* AURA settings */}
          <div className="bg-white rounded-2xl p-4 shadow-soft border border-ink-900/5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-extrabold">📡 Mon AURA</div>
                <div className="text-[11px] text-ink-700/55">Rayon · {profile?.aura_radius_m ?? 500}m</div>
              </div>
              <div className="w-10 h-6 bg-forest-500 rounded-full relative shadow-inner">
                <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow-soft" />
              </div>
            </div>
            <div className="bg-sand-100 rounded-xl p-3">
              <div className="flex justify-between text-[10px] font-bold text-ink-700/50 mb-2">
                <span>100m</span>
                <span className="text-forest-600">{profile?.aura_radius_m ?? 500}m</span>
                <span>2km Pro</span>
              </div>
              <div className="relative h-1.5 bg-sand-200 rounded-full">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-forest-400 to-forest-600 rounded-full"
                  style={{ width: `${(((profile?.aura_radius_m ?? 500) - 100) / 1900) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Mes annonces */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-black">Mes publications</div>
              <div className="text-[11px] text-ink-700/50 font-bold">{posts.length}</div>
            </div>
            {posts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-soft border border-ink-900/5">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-sm font-bold">Aucune publication pour l&apos;instant.</p>
                <Link
                  href="/compose"
                  className="inline-block mt-3 px-4 py-2 bg-ink-900 text-cream-50 rounded-full text-xs font-bold"
                >
                  ＋ Publier ma première annonce
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/post/${p.id}`}
                    className="aspect-square rounded-md lg:rounded-lg flex items-center justify-center text-4xl lg:text-5xl hover:opacity-80 transition relative overflow-hidden"
                    style={p.image_url ? undefined : { background: POST_TYPE_META[p.type as PostType].gradient }}
                    title={p.title}
                  >
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt={p.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      p.emoji
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
