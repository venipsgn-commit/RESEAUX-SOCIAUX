import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { Thread } from '@/components/Thread';
import { CallButtons } from '@/components/CallButtons';
import { createClient } from '@/lib/supabase/server';
import type { Message } from '@/lib/types';

export const dynamic = 'force-dynamic';

type MemberProfile = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_emoji: string;
  neighbor_score: number;
};

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/connexion');

  // Membres + type de conversation (RLS : vide si non membre)
  const [{ data: members }, { data: conv }, { data: msgs }] = await Promise.all([
    supabase.from('conversation_members').select('user_id, last_read_at').eq('conversation_id', params.id),
    supabase.from('conversations').select('is_group, title').eq('id', params.id).single(),
    supabase.from('messages').select('*').eq('conversation_id', params.id).order('created_at', { ascending: true }),
  ]);

  if (!members || members.length === 0) notFound();
  if (!members.some((m) => m.user_id === user.id)) notFound();

  const isGroup = !!conv?.is_group;
  const initialMessages = (msgs ?? []) as Message[];

  const { data: memberProfiles } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_emoji, neighbor_score')
    .in('id', members.map((m) => m.user_id));
  const profs = (memberProfiles ?? []) as MemberProfile[];

  const otherMember = members.find((m) => m.user_id !== user.id);
  const otherId = otherMember?.user_id;
  const other = profs.find((p) => p.id === otherId) ?? null;
  const otherReadAt = (otherMember?.last_read_at as string | null) ?? null;

  const senders: Record<string, { name: string; emoji: string }> = {};
  if (isGroup) {
    for (const p of profs) {
      senders[p.id] = { name: (p.display_name || p.handle || 'Voisin').split(' ')[0], emoji: p.avatar_emoji };
    }
  }

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        {/* Header conversation */}
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-3 lg:px-6 py-2.5 flex items-center gap-3">
          <Link href="/messages" className="text-sm font-bold text-ink-700/60 px-1">
            ←
          </Link>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-lg shadow-pin">
            {isGroup ? '👥' : (other?.avatar_emoji ?? '📍')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-sm truncate">
              {isGroup ? (conv?.title ?? 'Groupe') : (other?.display_name ?? 'Voisin·e')}
            </div>
            <div className="text-[11px] text-ink-700/55 truncate">
              {isGroup
                ? `${members.length} membres · ${profs.map((p) => p.display_name || p.handle).slice(0, 3).join(', ')}${members.length > 3 ? '…' : ''}`
                : `@${other?.handle} · Score `}
              {!isGroup && <b className="text-forest-600">{other?.neighbor_score ?? 50}</b>}
            </div>
          </div>
          {!isGroup && otherId && (
            <CallButtons
              otherId={otherId}
              otherName={other?.display_name ?? 'Voisin·e'}
              otherAvatar={other?.avatar_emoji ?? '📍'}
            />
          )}
        </header>

        <Thread
          conversationId={params.id}
          meId={user.id}
          initialMessages={initialMessages}
          initialOtherReadAt={otherReadAt}
          isGroup={isGroup}
          senders={senders}
        />
      </div>
    </Shell>
  );
}
