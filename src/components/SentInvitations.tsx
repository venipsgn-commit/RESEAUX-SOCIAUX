'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Sent = {
  id: string;
  addressee: string;
  handle: string | null;
  display_name: string | null;
  avatar_emoji: string | null;
};

export function SentInvitations() {
  const supabase = createClient();
  const [sent, setSent] = useState<Sent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.rpc('my_sent_requests').then(({ data }) => {
      setSent((data ?? []) as Sent[]);
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cancel(s: Sent) {
    setSent((x) => x.filter((y) => y.id !== s.id));
    await supabase.from('follows').delete().eq('id', s.id);
  }

  if (!loaded) return null;

  return (
    <div className="px-2 lg:px-6 py-2">
      <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mb-2 px-1">
        Invitations envoyées ({sent.length})
      </div>
      {sent.length === 0 ? (
        <p className="text-sm text-ink-700/50 py-4 text-center">Aucune invitation en attente.</p>
      ) : (
        <div className="space-y-2">
          {sent.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-1 py-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-lg flex-shrink-0">
                {s.avatar_emoji ?? '📍'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{s.display_name ?? 'Voisin·e'}</div>
                <div className="text-[11px] text-ink-700/55 truncate">⏳ En attente de réponse</div>
              </div>
              <button
                onClick={() => cancel(s)}
                className="px-3 py-1.5 bg-sand-100 text-ink-700 rounded-full text-xs font-bold active:scale-95 transition"
              >
                Annuler
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
