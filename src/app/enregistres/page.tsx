import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { createClient } from '@/lib/supabase/server';
import { POST_TYPE_META, type PostType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function SavedPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Shell>
        <div className="max-w-md mx-auto px-4 pt-24 lg:pt-40 text-center">
          <div className="text-5xl mb-3">🔖</div>
          <h1 className="text-2xl font-black">Tes enregistrements.</h1>
          <p className="text-sm text-ink-700/60 mt-2">Connecte-toi pour retrouver tes publications enregistrées.</p>
          <Link
            href="/connexion"
            className="inline-block mt-6 px-8 py-3.5 bg-ink-900 text-cream-50 rounded-full font-extrabold text-sm shadow-lift"
          >
            Se connecter
          </Link>
        </div>
      </Shell>
    );
  }

  const { data } = await supabase.rpc('my_saved_posts');
  const posts = (data ?? []) as {
    id: string;
    title: string;
    emoji: string;
    image_url: string | null;
    type: PostType;
    price_cents: number | null;
  }[];

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 py-3 flex items-center gap-3">
          <Link href="/profil" className="text-sm font-bold text-ink-700/60 px-1">
            ←
          </Link>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight">Enregistrés</h1>
        </header>

        <div className="px-4 lg:px-8 py-4">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🔖</div>
              <p className="font-bold">Rien d&apos;enregistré pour l&apos;instant.</p>
              <p className="text-sm text-ink-700/55 mt-1">Touche le signet 🔖 sur une publication pour la garder ici.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  href={`/post/${p.id}`}
                  className="aspect-square rounded-md flex items-center justify-center text-4xl relative overflow-hidden"
                  style={p.image_url ? undefined : { background: POST_TYPE_META[p.type].gradient }}
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
    </Shell>
  );
}
