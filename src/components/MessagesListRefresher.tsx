'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Rafraîchit la liste des conversations en temps réel : dès qu'un message
 * arrive dans une de mes conversations, on re-fetch la liste serveur → la
 * conversation remonte en haut, avec aperçu + badge à jour (façon WhatsApp).
 * Utilise le même mécanisme que le chat (filtre postgres_changes) qui marche.
 */
export function MessagesListRefresher({ uid, convIds }: { uid: string; convIds: string[] }) {
  const supabase = createClient();
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = convIds.join(',');

  useEffect(() => {
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 200);
    };

    const channel = supabase.channel(`msglist:${uid}`);
    if (convIds.length) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=in.(${convIds.join(',')})`,
        },
        refresh,
      );
    }
    channel.subscribe();

    // Filet de sécurité : rafraîchit au retour sur l'onglet
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', onVisible);
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, uid]);

  return null;
}
