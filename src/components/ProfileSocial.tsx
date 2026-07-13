'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InvitationList } from './InvitationList';

type Person = {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  avatar_emoji: string | null;
};

export function ProfileSocial() {
  const supabase = createClient();
  const [followers, setFollowers] = useState<Person[] | null>(null);
  const [showFollowers, setShowFollowers] = useState(false);

  async function toggleFollowers() {
    if (!showFollowers && followers === null) {
      const { data } = await supabase.rpc('my_followers');
      setFollowers((data ?? []) as Person[]);
    }
    setShowFollowers((v) => !v);
  }

  return (
    <div className="space-y-3">
      {/* Invitations reçues (Accepter / Refuser) */}
      <div className="-mx-2 lg:mx-0">
        <InvitationList />
      </div>

      {/* Liste d'abonnés — visible seulement par le propriétaire */}
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
