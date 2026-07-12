'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Rafraîchit la liste des conversations en temps réel : dès qu'un message
 * arrive (RLS limite aux conversations de l'utilisateur), on re-fetch la
 * liste serveur → la conversation concernée remonte en haut, avec l'aperçu
 * et le badge à jour (façon WhatsApp).
 */
export function MessagesListRefresher({ uid }: { uid: string }) {
  const supabase = createClient();
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ch = supabase
      .channel(`msglist:${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => router.refresh(), 250);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  return null;
}
