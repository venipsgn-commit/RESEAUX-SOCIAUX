import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { ContactButton } from '@/components/ContactButton';
import { ProfileMoreMenu } from '@/components/ProfileMoreMenu';
import { createClient } from '@/lib/supabase/server';
import { POST_TYPE_META, type PostType } from '@/lib/types';

export const dynamic = 'force-dynamic';

type PublicProfile = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_emoji: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  tagline: string | null;
  quartier: string | null;
  neighbor_score: number;
  is_pro: boolean;
  created_at: string;
  followers: number;
  following: number;
  posts: number;
  status: 'self' | 'accepted' | 'pending_out' | 'pending_in' | 'none';
  blocked: boolean;
};

export default async function UserProfilePage({ params }: { params: { handle: string } }) {
  const supabase = createClient();
  const { data } = await supabase.rpc('public_profile', { p_handle: params.handle });
  const prof = (data?.[0] ?? null) as PublicProfile | null;
  if (!prof) notFound();

  const isSelf = prof.status === 'self';
  const { data: postsData } = await supabase
    .from('posts')
    .select('id, type, emoji, title, image_url')
    .eq('author_id', prof.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  const posts = postsData ?? [];
  const memberSince = new Date(prof.created_at).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  const stat = (n: number, label: string) => (
    <div className="text-center flex-1">
      <div className="text-xl font-black">{n}</div>
      <div className="text-[10px] text-ink-700/55 font-bold uppercase tracking-wider">{label}</div>
    </div>
  );

  return (
    <Shell>
      <div className="max-w-3xl mx-auto pb-10">
        {/* Couverture */}
        <div className="relative h-32 lg:h-48 overflow-hidden">
          {prof.cover_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={prof.cover_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-forest-400 via-forest-500 to-forest-600" />
          )}
          <Link href="/voisinage" className="absolute top-3 left-3 w-9 h-9 bg-cream-50/90 rounded-full flex items-center justify-center font-bold shadow-soft">
            ←
          </Link>
        </div>

        <div className="px-4 lg:px-8 -mt-14">
          <div className="relative w-28 h-28">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-6xl shadow-lift border-4 border-cream-50 overflow-hidden">
              {prof.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={prof.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                prof.avatar_emoji
              )}
            </div>
            <div className="absolute bottom-1 right-1 bg-forest-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border-[3px] border-cream-50 shadow-pin">
              {prof.neighbor_score}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-black tracking-tight">{prof.display_name ?? prof.handle}</h1>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#3f9e5c" aria-label="Vérifié">
                <path d="M12 2l2.4 1.8 3 .3 1 2.8 2.3 1.9-.9 2.9.9 2.9-2.3 1.9-1 2.8-3 .3L12 22l-2.4-1.8-3-.3-1-2.8L3.3 15l.9-2.9L3.3 9.2l2.3-1.9 1-2.8 3-.3z" />
                <path d="M9.5 12.5l1.8 1.8 3.5-3.8" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-sm text-ink-700/55 font-semibold">@{prof.handle}</div>
            {prof.bio && <p className="text-sm text-ink-900/85 mt-2">{prof.bio}</p>}
            {prof.tagline && <p className="hand text-lg text-coral-500 -mt-0.5">&quot;{prof.tagline}&quot;</p>}
            <div className="mt-2 space-y-1 text-sm text-ink-700/75">
              <div className="flex items-center gap-2.5"><span className="w-5 text-center">📍</span>{prof.quartier ?? 'Quartier non défini'}</div>
              <div className="flex items-center gap-2.5"><span className="w-5 text-center">🗓️</span>Membre depuis {memberSince}</div>
              {prof.is_pro && (
                <div className="flex items-center gap-2.5 text-sunset-500 font-semibold"><span className="w-5 text-center">🚀</span>Compte Pro</div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 bg-surface rounded-2xl p-3 shadow-soft border border-ink-900/5 flex">
            {stat(prof.posts, 'publications')}
            {stat(prof.followers, 'abonnés')}
            {stat(prof.following, 'abonnements')}
          </div>

          {/* Actions */}
          {isSelf ? (
            <Link
              href="/profil"
              className="mt-4 block text-center w-full py-2.5 bg-sand-200 text-ink-900 rounded-full font-extrabold text-sm shadow-soft"
            >
              Voir mon profil
            </Link>
          ) : (
            <div className="mt-4 flex gap-2.5 items-stretch">
              <div className="flex-1">
                <ContactButton otherId={prof.id} otherHandle={prof.handle} />
              </div>
              <ProfileMoreMenu userId={prof.id} handle={prof.handle} blocked={prof.blocked} />
            </div>
          )}

          {/* Publications */}
          <div className="mt-6">
            <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mb-2">
              Publications
            </div>
            {posts.length === 0 ? (
              <div className="bg-surface rounded-2xl p-8 text-center shadow-soft border border-ink-900/5 text-sm font-bold text-ink-700/60">
                Aucune publication.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/post/${p.id}`}
                    className="aspect-square rounded-md flex items-center justify-center text-4xl relative overflow-hidden"
                    style={p.image_url ? undefined : { background: POST_TYPE_META[p.type as PostType].gradient }}
                    title={p.title}
                  >
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
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
