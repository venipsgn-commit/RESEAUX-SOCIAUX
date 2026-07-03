import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { ReactionBar } from '@/components/ReactionBar';
import { DeletePostButton } from '@/components/DeletePostButton';
import { createClient } from '@/lib/supabase/server';
import { type PostDetail, POST_TYPE_META, formatPrice, timeAgo } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function PostPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data }, { data: userData }] = await Promise.all([
    supabase.rpc('post_detail', { post_id: params.id }),
    supabase.auth.getUser(),
  ]);

  const post = (data?.[0] ?? null) as PostDetail | null;
  if (!post) notFound();

  const user = userData?.user ?? null;
  const isOwner = user?.id === post.author_id;
  const meta = POST_TYPE_META[post.type];
  const price = formatPrice(post.price_cents);

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/voisinage" className="text-sm font-bold text-ink-700/60">
            ← Retour
          </Link>
          <span className={`chip ${meta.chipClass}`}>{meta.label}</span>
        </header>

        <div className="px-3 lg:px-8 py-4 space-y-4">
          {/* Auteur */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-xl shadow-pin">
              {post.author_avatar_emoji}
            </div>
            <div className="flex-1">
              <div className="font-extrabold">{post.author_display_name}</div>
              <div className="text-xs text-ink-700/60">
                @{post.author_handle} · Score{' '}
                <b className="text-forest-600">{post.author_neighbor_score}</b> · {timeAgo(post.created_at)}
              </div>
            </div>
          </div>

          {/* Visuel */}
          <div
            className="aspect-square rounded-3xl flex flex-col items-center justify-center text-[160px] relative overflow-hidden"
            style={{ background: meta.gradient }}
          >
            {post.type === 'geolock' ? (
              <>
                <div className="text-8xl opacity-50">🔒</div>
                {post.geolock_hint && (
                  <div className="mt-4 px-4 py-2 bg-ink-900/85 backdrop-blur rounded-full text-white text-sm font-bold">
                    📍 {post.geolock_hint}
                  </div>
                )}
              </>
            ) : (
              <span>{post.emoji}</span>
            )}
            {price && (
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur px-5 py-3 rounded-2xl">
                <div className="text-3xl font-black text-ink-900">{price}</div>
              </div>
            )}
          </div>

          {/* Réactions */}
          <ReactionBar
            postId={post.id}
            initialLiked={post.viewer_liked}
            initialSaved={post.viewer_saved}
            initialLikeCount={post.like_count}
          />

          {/* Contenu */}
          <div>
            <h1 className="text-xl font-black">{post.title}</h1>
            {post.body && <p className="text-sm text-ink-700/85 mt-2 whitespace-pre-wrap">{post.body}</p>}
            {post.event_at && (
              <div className="mt-3 inline-flex items-center gap-2 bg-sunset-300/40 text-sunset-500 rounded-full px-3 py-1.5 text-xs font-bold">
                🗓{' '}
                {new Date(post.event_at).toLocaleString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          {isOwner ? (
            <div className="bg-white rounded-2xl p-4 shadow-soft border border-ink-900/5 space-y-2">
              <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50">
                C&apos;est ton post
              </div>
              <DeletePostButton postId={post.id} redirectTo="/profil" variant="full" />
            </div>
          ) : (
            <div className="space-y-2">
              {post.type === 'sell' && (
                <button className="w-full py-3 bg-gradient-to-br from-forest-400 to-forest-600 text-white rounded-full font-extrabold text-sm shadow-soft">
                  Acheter en escrow · {price}
                </button>
              )}
              {post.type === 'service' && (
                <button className="w-full py-3 bg-coral-500 text-white rounded-full font-extrabold text-sm shadow-soft">
                  📅 Réserver · {price}
                </button>
              )}
              {post.type === 'event' && (
                <button className="w-full py-3 bg-sunset-500 text-white rounded-full font-extrabold text-sm shadow-soft">
                  Je viens 🙋
                </button>
              )}
              {post.type === 'geolock' && (
                <button className="w-full py-3 bg-gradient-to-br from-lilac-300 to-lilac-500 text-white rounded-full font-extrabold text-sm shadow-soft">
                  🚶 M&apos;y rendre pour débloquer
                </button>
              )}
              <button className="w-full py-3 bg-ink-900 text-cream-50 rounded-full font-extrabold text-sm shadow-soft">
                💬 Contacter {post.author_handle}
              </button>
            </div>
          )}

          {post.author_bio && (
            <div className="bg-sand-100 rounded-2xl p-4">
              <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mb-1">
                À propos de {post.author_handle}
              </div>
              <p className="text-sm text-ink-700/80">{post.author_bio}</p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
