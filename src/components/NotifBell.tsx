'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Cloche de notifications avec badge du nombre de non-lues, mis à jour en
 * temps réel (Supabase Realtime). Se recompte à chaque changement de page
 * (utile après /notifications qui marque tout comme lu).
 * Le son + bandeau à l'arrivée d'une notif sont gérés globalement par
 * <NotifWatcher /> (monté dans le Shell).
 */
export function NotifBell({ variant = 'inline' }: { variant?: 'inline' | 'floating' }) {
  const supabase = createClient();
  const pathname = usePathname();
  const instanceId = useId();
  const [uid, setUid] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (Re)compte les non-lues au montage et à chaque navigation
  useEffect(() => {
    if (!uid) return;
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('read', false)
      .then(({ count }) => setCount(count ?? 0));
  }, [uid, pathname, supabase]);

  // Incrément en temps réel
  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`notif:${uid}:${instanceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        () => setCount((c) => c + 1),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const badge =
    count > 0 ? (
      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-coral-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-cream-50">
        {count > 9 ? '9+' : count}
      </span>
    ) : null;

  if (variant === 'floating') {
    return (
      <Link
        href="/notifications"
        aria-label="Notifications"
        className="relative w-10 h-10 bg-cream-50/95 backdrop-blur-xl rounded-full shadow-soft flex items-center justify-center"
      >
        🔔
        {badge}
      </Link>
    );
  }

  return (
    <Link href="/notifications" aria-label="Notifications" className="relative text-xl">
      🔔
      {badge}
    </Link>
  );
}
