'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Toast = { id: number; icon: string; text: string };

const TOAST_BY_TYPE: Record<string, { icon: string; text: string }> = {
  message: { icon: '💬', text: 'Nouveau message' },
  like: { icon: '❤️', text: 'Quelqu’un a aimé ton post' },
  comment: { icon: '🗨️', text: 'Nouveau commentaire' },
};

// Son de notification synthétisé (aucun fichier requis). Un petit "ding-dong".
function playChime() {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const notes = [880, 1174.7]; // La5 -> Ré6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.34);
    });
    setTimeout(() => ctx.close(), 900);
  } catch {
    /* audio non disponible — on ignore silencieusement */
  }
}

/**
 * Cloche de notifications avec badge du nombre de non-lues, mis à jour en
 * temps réel (Supabase Realtime). Se recompte à chaque changement de page
 * (utile après /notifications qui marque tout comme lu).
 */
export function NotifBell({ variant = 'inline' }: { variant?: 'inline' | 'floating' }) {
  const supabase = createClient();
  const pathname = usePathname();
  const instanceId = useId();
  const [uid, setUid] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const soundReady = useRef(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Débloque l'audio au 1er geste utilisateur (politique navigateur)
  useEffect(() => {
    const unlock = () => {
      soundReady.current = true;
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
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
        (payload) => {
          setCount((c) => c + 1);
          const type = (payload.new as { type?: string }).type ?? 'message';
          const meta = TOAST_BY_TYPE[type] ?? TOAST_BY_TYPE.message;
          if (soundReady.current) playChime();
          const id = performance.now();
          setToasts((t) => [...t, { id, icon: meta.icon, text: meta.text }]);
          setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
        },
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

  const toastStack = (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2 items-center w-[calc(100%-1.5rem)] max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <Link
          key={t.id}
          href="/notifications"
          className="pointer-events-auto w-full bg-ink-900 text-cream-50 rounded-2xl shadow-lift px-4 py-3 flex items-center gap-3 animate-fade-up"
        >
          <span className="text-xl">{t.icon}</span>
          <span className="text-sm font-bold flex-1">{t.text}</span>
          <span className="text-[10px] uppercase tracking-wider opacity-60">Voir</span>
        </Link>
      ))}
    </div>
  );

  if (variant === 'floating') {
    return (
      <>
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative w-10 h-10 bg-cream-50/95 backdrop-blur-xl rounded-full shadow-soft flex items-center justify-center"
        >
          🔔
          {badge}
        </Link>
        {toastStack}
      </>
    );
  }

  return (
    <>
      <Link href="/notifications" aria-label="Notifications" className="relative text-xl">
        🔔
        {badge}
      </Link>
      {toastStack}
    </>
  );
}
