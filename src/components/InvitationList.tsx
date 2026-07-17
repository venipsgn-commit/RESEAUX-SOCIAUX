'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

type Req = {
  id: string;
  requester: string;
  handle: string | null;
  display_name: string | null;
  avatar_emoji: string | null;
};

/**
 * Liste des invitations de connexion reçues, avec Accepter / Refuser.
 * Réutilisée sur Notifications, Messages et Profil.
 */
export function InvitationList({ title = 'Invitations reçues' }: { title?: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.rpc('my_follow_requests').then(({ data }) => {
      setReqs((data ?? []) as Req[]);
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function respond(r: Req, accept: boolean) {
    setReqs((x) => x.filter((y) => y.id !== r.id));
    await supabase.rpc('respond_follow', { req_id: r.id, accept });
    if (accept) {
      toast({
        icon: '🤝',
        title: `Connecté avec ${r.display_name ?? 'ce voisin'} !`,
        text: 'Vous pouvez maintenant discuter.',
      });
    }
    router.refresh();
  }

  if (!loaded || reqs.length === 0) return null;

  return (
    <div className="bg-surface rounded-2xl p-4 shadow-soft border border-forest-500/20 mx-2 lg:mx-0 my-2">
      <div className="text-[11px] uppercase tracking-wider font-bold text-forest-600 mb-2.5">
        👋 {title} ({reqs.length})
      </div>
      <div className="space-y-2.5">
        {reqs.map((r) => (
          <div key={r.id} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lilac-300 to-lilac-500 flex items-center justify-center text-lg flex-shrink-0">
              {r.avatar_emoji ?? '📍'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">{r.display_name ?? 'Voisin·e'}</div>
              <div className="text-[11px] text-ink-700/55 truncate">veut faire connaissance</div>
            </div>
            <button
              onClick={() => respond(r, true)}
              className="px-3.5 py-1.5 bg-forest-500 text-white rounded-full text-xs font-bold active:scale-95 transition"
            >
              Accepter
            </button>
            <button
              onClick={() => respond(r, false)}
              className="px-3 py-1.5 bg-sand-100 text-ink-700 rounded-full text-xs font-bold active:scale-95 transition"
            >
              Refuser
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
