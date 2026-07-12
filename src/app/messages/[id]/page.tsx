import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { Thread } from '@/components/Thread';
import { createClient } from '@/lib/supabase/server';
import type { Message, Profile } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/connexion');

  // Membres de la conversation (RLS : renvoie vide si non membre)
  const { data: members } = await supabase
    .from('conversation_members')
    .select('user_id, last_read_at')
    .eq('conversation_id', params.id);

  if (!members || members.length === 0) notFound();
  const isMember = members.some((m) => m.user_id === user.id);
  if (!isMember) notFound();

  const otherMember = members.find((m) => m.user_id !== user.id);
  const otherId = otherMember?.user_id;
  const otherReadAt = (otherMember?.last_read_at as string | null) ?? null;

  const [{ data: otherProfile }, { data: msgs }] = await Promise.all([
    otherId
      ? supabase.from('profiles').select('*').eq('id', otherId).single()
      : Promise.resolve({ data: null }),
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true }),
  ]);

  const other = otherProfile as Profile | null;
  const initialMessages = (msgs ?? []) as Message[];

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        {/* Header conversation */}
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-3 lg:px-6 py-2.5 flex items-center gap-3">
          <Link href="/messages" className="text-sm font-bold text-ink-700/60 px-1">
            ←
          </Link>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-lg shadow-pin">
            {other?.avatar_emoji ?? '📍'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-sm truncate">
              {other?.display_name ?? 'Voisin·e'}
            </div>
            <div className="text-[11px] text-ink-700/55">
              @{other?.handle} · Score{' '}
              <b className="text-forest-600">{other?.neighbor_score ?? 50}</b>
            </div>
          </div>
        </header>

        <Thread
          conversationId={params.id}
          meId={user.id}
          initialMessages={initialMessages}
          initialOtherReadAt={otherReadAt}
        />
      </div>
    </Shell>
  );
}
