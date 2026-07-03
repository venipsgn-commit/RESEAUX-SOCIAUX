import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { LogoutButton } from '@/components/LogoutButton';
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
  const [{ data: profileData }, { data: myPosts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('posts')
      .select('id, type, emoji, title, status, image_url')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  const profile = profileData as Profile | null;
  const posts = myPosts ?? [];
  const sales = posts.filter((p) => p.type === 'sell').length;
  const services = posts.filter((p) => p.type === 'service').length;

  return (
    <Shell>
      <div className="max-w-3xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 py-3 flex items-center justify-between">
          <span className="font-black text-lg">{profile?.handle ?? '…'}</span>
          <LogoutButton />
        </header>

        <div className="px-4 lg:px-8 py-4 space-y-4">
          <div className="flex gap-5 items-center">
            <div className="relative">
              <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-5xl shadow-lift border-4 border-white">
                {profile?.avatar_emoji ?? '📍'}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-forest-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                {profile?.neighbor_score ?? 50}
              </div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xl lg:text-2xl font-black">{sales}</div>
                <div className="text-[10px] text-ink-700/55 font-bold uppercase tracking-wider">
                  ventes
                </div>
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-black">{services}</div>
                <div className="text-[10px] text-ink-700/55 font-bold uppercase tracking-wider">
                  services
                </div>
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-black">{posts.length}</div>
                <div className="text-[10px] text-ink-700/55 font-bold uppercase tracking-wider">
                  posts
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="font-extrabold">
              {profile?.display_name} <span className="text-forest-500">✓</span>
            </div>
            <div className="text-xs text-ink-700/60 mt-0.5">
              📍 {profile?.quartier ?? 'Quartier non défini'} · membre depuis{' '}
              {profile
                ? new Date(profile.created_at).toLocaleDateString('fr-FR', {
                    month: 'long',
                    year: 'numeric',
                  })
                : '…'}
            </div>
            {profile?.bio && <p className="text-sm mt-2 text-ink-700/85">{profile.bio}</p>}
            {profile?.tagline && (
              <p className="hand text-lg text-coral-500 -mt-0.5">&quot;{profile.tagline}&quot;</p>
            )}
          </div>

          {/* AURA settings */}
          <div className="bg-white rounded-2xl p-4 shadow-soft border border-ink-900/5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-extrabold">📡 Mon AURA</div>
                <div className="text-[11px] text-ink-700/55">
                  Rayon · {profile?.aura_radius_m ?? 500}m
                </div>
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
            <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mb-2">
              Mes annonces
            </div>
            {posts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-soft border border-ink-900/5">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-sm font-bold">Aucune annonce pour l&apos;instant.</p>
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
