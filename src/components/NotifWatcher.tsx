'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Toast = { id: number; icon: string; text: string };

const TOAST_BY_TYPE: Record<string, { icon: string; text: string }> = {
  message: { icon: '💬', text: 'Nouveau message' },
  like: { icon: '❤️', text: 'Quelqu’un a aimé ton post' },
  comment: { icon: '🗨️', text: 'Nouveau commentaire' },
};

/**
 * Écouteur global de notifications, monté une seule fois dans le Shell.
 * → joue un son + affiche un bandeau à chaque nouvelle notification, quelle
 *   que soit la page (le son est débloqué au 1er geste, règle des navigateurs).
 */
export function NotifWatcher() {
  const supabase = createClient();
  const [uid, setUid] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const audioRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);

  function ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!audioRef.current) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      audioRef.current = new AC();
    }
    return audioRef.current;
  }

  function playChime() {
    const ctx = ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const notes = [880, 1174.7]; // La5 -> Ré6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.34);
    });
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Débloque l'audio au tout premier geste utilisateur (obligatoire)
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      const ctx = ensureCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`notif-watch:${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        (payload) => {
          const type = (payload.new as { type?: string }).type ?? 'message';
          const meta = TOAST_BY_TYPE[type] ?? TOAST_BY_TYPE.message;
          playChime();
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

  if (toasts.length === 0) return null;

  return (
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
}
