'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  conversationId: string;
  title: string;
  subtitle: string;
  score?: number | null;
  handle?: string | null;
  isGroup: boolean;
};

/**
 * Nom de la conversation cliquable → menu d'options (voir le profil, supprimer la conversation).
 * La suppression est « pour moi » (façon WhatsApp) : la conversation disparaît de ma liste
 * et son historique est masqué chez moi, sans confirmation par boîte de dialogue.
 */
export function ConversationOptions({ conversationId, title, subtitle, score, handle, isGroup }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function del() {
    setBusy(true);
    await supabase.rpc('delete_conversation', { conv_id: conversationId });
    router.push('/messages');
    router.refresh();
  }

  return (
    <div className="relative flex-1 min-w-0">
      <button
        onClick={() => {
          setOpen((o) => !o);
          setConfirming(false);
        }}
        className="text-left w-full min-w-0"
        aria-label="Options de la conversation"
      >
        <div className="font-extrabold text-sm truncate flex items-center gap-1">
          <span className="truncate">{title}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`flex-shrink-0 text-ink-700/40 transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        <div className="text-[11px] text-ink-700/55 truncate">
          {subtitle}
          {!isGroup && <b className="text-forest-600"> {score ?? 50}</b>}
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 bg-surface rounded-2xl shadow-lift border border-ink-900/10 py-1.5 min-w-[240px] overflow-hidden">
            {!isGroup && handle && (
              <Link
                href={`/u/${handle}`}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-sand-100/60 transition"
                onClick={() => setOpen(false)}
              >
                <span className="text-base">👤</span> Voir le profil
              </Link>
            )}
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-coral-500 hover:bg-coral-500/5 transition"
              >
                <span className="text-base">🗑</span> Supprimer la conversation
              </button>
            ) : (
              <div className="px-4 py-2.5">
                <p className="text-xs text-ink-700/60 mb-2">
                  Elle disparaîtra de ta liste. Confirmer ?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={del}
                    disabled={busy}
                    className="flex-1 px-3 py-2 rounded-full bg-coral-500 text-white text-xs font-bold disabled:opacity-60"
                  >
                    {busy ? 'Suppression…' : 'Supprimer'}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={busy}
                    className="px-3 py-2 rounded-full bg-ink-900/5 text-ink-700 text-xs font-bold"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
