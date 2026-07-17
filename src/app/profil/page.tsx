import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { LogoutButton } from '@/components/LogoutButton';
import { AvatarUpload } from '@/components/AvatarUpload';
import { CoverUpload } from '@/components/CoverUpload';
import { AuraToggle } from '@/components/AuraToggle';
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
        <div className="relative h-36 lg:h-52">
          <CoverUpload coverUrl={profile?.cover_url ?? null} />
          <div className="absolute top-3 right-3 lg:top-4 lg:right-4 z-10">
            <LogoutButton />
          </div>
        </div>

        {/* ── EN-TÊTE PROFIL ─────────────────────────────────────── */}
        <div className="px-4 lg:px-8 -mt-14">
          <AvatarUpload
            avatarUrl={profile?.avatar_url ?? null}
            avatarEmoji={profile?.avatar_emoji ?? '📍'}
            score={profile?.neighbor_score ?? 50}
          />

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
              {profile?.is_private && (
                <div className="flex items-center gap-2.5 text-forest-600 font-semibold">
                  <span className="w-5 text-center">🔒</span>
                  <span>Profil privé · invisible sur la carte</span>
                </div>
              )}
              {profile?.is_pro && (
                <div className="flex items-center gap-2.5 text-sunset-500 font-semibold">
                  <span className="w-5 text-center">🚀</span>
                  <span>Compte Pro · aura jusqu&apos;à 10 km</span>
                </div>
              )}
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
              href="/profil/modifier"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-br from-forest-400 to-forest-600 text-white rounded-full font-extrabold text-sm shadow-soft"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
              </svg>
              Modifier le profil
            </Link>
            <Link
              href="/compose"
              aria-label="Publier"
              className="w-11 flex items-center justify-center bg-sand-200 text-ink-900 rounded-full shadow-soft"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Link>
            <Link
              href="/voisins"
              aria-label="Mes voisins"
              className="w-11 flex items-center justify-center bg-sand-200 text-ink-900 rounded-full shadow-soft"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="px-4 lg:px-8 mt-5 space-y-4">
          {/* Raccourcis */}
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/commandes"
              className="flex items-center gap-2.5 bg-white rounded-2xl px-3.5 py-3 shadow-soft border border-ink-900/5"
            >
              <span className="text-xl">🧾</span>
              <div className="font-extrabold text-sm leading-tight">Mes commandes</div>
            </Link>
            <Link
              href="/enregistres"
              className="flex items-center gap-2.5 bg-white rounded-2xl px-3.5 py-3 shadow-soft border border-ink-900/5"
            >
              <span className="text-xl">🔖</span>
              <div className="font-extrabold text-sm leading-tight">Enregistrés</div>
            </Link>
          </div>

          {/* Invitations reçues (Accepter / Refuser) */}
          <InvitationList />

          {/* AURA — activer / désactiver */}
          <AuraToggle
            initialActive={!(profile?.is_private ?? false)}
            radius={profile?.aura_radius_m ?? 500}
          />

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
