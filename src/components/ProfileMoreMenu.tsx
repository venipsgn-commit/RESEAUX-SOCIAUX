'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

export function ProfileMoreMenu({
  userId,
  handle,
  blocked,
}: {
  userId: string;
  handle: string;
  blocked: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(blocked);

  useEffect(() => setMounted(true), []);

  async function toggleBlock() {
    if (isBlocked) {
      setIsBlocked(false);
      setOpen(false);
      await supabase.rpc('unblock_user', { other: userId });
      toast({ icon: '✅', title: `${handle} débloqué·e` });
    } else {
      setIsBlocked(true);
      setOpen(false);
      await supabase.rpc('block_user', { other: userId });
      toast({ icon: '🚫', title: `${handle} bloqué·e`, text: 'Vous ne vous verrez plus.' });
      router.push('/voisinage');
    }
  }

  async function report() {
    setOpen(false);
    await supabase.rpc('report_content', { p_post_id: null, p_user_id: userId, p_reason: 'profil signalé' });
    toast({ icon: '🚩', title: 'Merci', text: 'Signalement envoyé à la modération.' });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Plus d'options"
        className="w-11 h-11 flex items-center justify-center bg-sand-200 text-ink-900 rounded-full shadow-soft"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[120] flex flex-col justify-end" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-cream-50 rounded-t-3xl p-4 pb-8" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-ink-900/15 mx-auto mb-4" />
              <button
                onClick={report}
                className="w-full text-left px-4 py-3.5 rounded-2xl bg-surface border border-ink-900/5 font-bold text-sm mb-2"
              >
                🚩 Signaler ce profil
              </button>
              <button
                onClick={toggleBlock}
                className="w-full text-left px-4 py-3.5 rounded-2xl bg-surface border border-ink-900/5 font-bold text-sm text-coral-500"
              >
                {isBlocked ? `✅ Débloquer @${handle}` : `🚫 Bloquer @${handle}`}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-full text-center px-4 py-3 mt-2 rounded-2xl font-bold text-sm text-ink-700/60"
              >
                Annuler
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
