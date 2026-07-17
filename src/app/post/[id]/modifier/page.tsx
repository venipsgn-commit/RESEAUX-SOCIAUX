import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { EditPostForm } from '@/components/EditPostForm';
import { createClient } from '@/lib/supabase/server';
import type { PostType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/connexion');

  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id, title, body, price_cents, type')
    .eq('id', params.id)
    .single();

  if (!post) notFound();
  if (post.author_id !== user.id) redirect(`/post/${params.id}`);

  return (
    <Shell>
      <div className="max-w-xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 py-3 flex items-center gap-3">
          <Link href={`/post/${params.id}`} className="text-sm font-bold text-ink-700/60 px-1">
            ←
          </Link>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight">Modifier l&apos;annonce</h1>
        </header>
        <div className="px-4 lg:px-8 py-4">
          <EditPostForm
            post={{
              id: post.id,
              title: post.title,
              body: post.body,
              price_cents: post.price_cents,
              type: post.type as PostType,
            }}
          />
        </div>
      </div>
    </Shell>
  );
}
