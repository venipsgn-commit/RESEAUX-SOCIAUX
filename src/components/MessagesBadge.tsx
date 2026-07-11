'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Pastille rouge indiquant le nombre de messages non lus, mise à jour en
 * temps réel. Se recompte à chaque navigation (donc le badge redescend
 * après avoir lu une conversation, qui la marque comme lue).
 * À placer dans un parent en `position: relative`.
 */
export function MessagesBadge() {
  const supabase = createClient();
  const pathname = usePathname();
  const instanceId = useId();
  const [uid, setUid] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompte au montage et à chaque changement de page
  useEffect(() => {
    if (!uid) return;
    supabase.rpc('unread_messages_count').then(({ data }) => setCount((data as number) ?? 0));
  }, [uid, pathname, supabase]);

  // Incrément en temps réel (RLS : on ne reçoit que nos conversations)
  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`msg-unread:${uid}:${instanceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as { sender_id?: string; conversation_id?: string };
          // Ignore mes propres messages et la conversation ouverte
          if (m.sender_id === uid) return;
          if (pathname === `/messages/${m.conversation_id}`) return;
          setCount((c) => c + 1);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, pathname]);

  if (count <= 0) return null;

  return (
    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-coral-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-cream-50">
      {count > 9 ? '9+' : count}
    </span>
  );
}
