'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Req = {
  id: string;
  requester: string;
  handle: string | null;
  display_name: string | null;
  avatar_emoji: string | null;
};
type Person = {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  avatar_emoji: string | null;
};

export function ProfileSocial() {
  const supabase = createClient();
  const router = useRouter();
  const [requests, setRequests] = useState<Req[]>([]);
  const [followers, setFollowers] = useState<Person[] | null>(null);
  const [showFollowers, setShowFollowers] = useState(false);

  useEffect(() => {
    supabase.rpc('my_follow_requests').then(({ data }) => setRequests((data ?? []) as Req[]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function respond(id: string, accept: boolean) {
    setRequests((r) => r.filter((x) => x.id !== id));
    await supabase.rpc('respond_follow', { req_id: id, accept });
    router.refresh();
  }

  async function toggleFollowers() {
    if (!showFollowers && followers === null) {
      const { data } = await supabase.rpc('my_followers');
      setFollowers((data ?? []) as Person[]);
    }
    setShowFollowers((v) => !v);
  }

  return (
    <div className="space-y-3">
      {/* Invitations reçues */}
      {requests.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-soft border border-ink-900/5">
          <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mb-2">
            Invitations reçues ({requests.length})
          </div>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lilac-300 to-lilac-500 flex items-center justify-center text-lg flex-shrink-0">
                  {r.avatar_emoji ?? '📍'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{r.display_name ?? 'Voisin·e'}</div>
                  <div className="text-[11px] text-ink-700/55 truncate">
                    veut faire connaissance
                  </div>
                </div>
                <button
                  onClick={() => respond(r.id, true)}
                  className="px-3 py-1.5 bg-forest-500 text-white rounded-full text-xs font-bold"
                >
                  Accepter
                </button>
                <button
                  onClick={() => respond(r.id, false)}
                  className="px-3 py-1.5 bg-sand-100 text-ink-700 rounded-full text-xs font-bold"
                >
                  Refuser
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste d'abonnés (privée : visible seulement par le propriétaire) */}
      <button
        onClick={toggleFollowers}
        className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-soft border border-ink-900/5"
      >
        <span className="text-sm font-bold">👥 Voir mes abonnés</span>
        <span className="text-ink-700/40">{showFollowers ? '▲' : '▼'}</span>
      </button>
      {showFollowers && followers && (
        <div className="bg-white rounded-2xl p-4 shadow-soft border border-ink-900/5">
          {followers.length === 0 ? (
            <p className="text-sm text-ink-700/50 text-center py-2">Aucun abonné pour l&apos;instant.</p>
          ) : (
            <div className="space-y-2.5">
              {followers.map((p) => (
                <div key={p.user_id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-base flex-shrink-0">
                    {p.avatar_emoji ?? '📍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{p.display_name ?? 'Voisin·e'}</div>
                    <div className="text-[11px] text-ink-700/50 truncate">@{p.handle ?? 'voisin'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
