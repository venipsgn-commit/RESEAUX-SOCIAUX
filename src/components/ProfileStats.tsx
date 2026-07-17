'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';

type Person = {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  avatar_emoji: string | null;
};

export function ProfileStats({
  posts,
  followers,
  following,
}: {
  posts: number;
  followers: number;
  following: number;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState<null | 'followers' | 'following'>(null);
  const [list, setList] = useState<Person[] | null>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById('profile-lists'));
  }, []);

  async function toggle(which: 'followers' | 'following') {
    if (open === which) {
      setOpen(null);
      return;
    }
    setOpen(which);
    setList(null);
    const { data } = await supabase.rpc(which === 'followers' ? 'my_followers' : 'my_following');
    setList((data ?? []) as Person[]);
  }

  const stat = (n: number, label: string, onClick?: () => void, active?: boolean) => (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`py-1 rounded-xl transition ${active ? 'bg-forest-500/10' : onClick ? 'active:bg-sand-100' : ''}`}
    >
      <div className="text-xl lg:text-2xl font-black">{n}</div>
      <div className="text-[10px] text-ink-700/55 font-bold uppercase tracking-wider">{label}</div>
    </button>
  );

  return (
    <>
      <div className="flex-1 grid grid-cols-3 gap-1 text-center">
        {stat(posts, 'publications')}
        {stat(followers, 'abonnés', () => toggle('followers'), open === 'followers')}
        {stat(following, 'abonnements', () => toggle('following'), open === 'following')}
      </div>

      {slot &&
        open &&
        createPortal(
          <div className="bg-surface rounded-2xl p-4 shadow-soft border border-ink-900/5 animate-fade-up">
            <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mb-2">
              {open === 'followers' ? 'Mes abonnés' : 'Mes abonnements'}
            </div>
            {list === null ? (
              <p className="text-sm text-ink-700/40 text-center py-2">…</p>
            ) : list.length === 0 ? (
              <p className="text-sm text-ink-700/50 text-center py-2">
                {open === 'followers' ? 'Aucun abonné pour l’instant.' : 'Tu ne suis personne encore.'}
              </p>
            ) : (
              <div className="space-y-2.5">
                {list.map((p) => (
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
          </div>,
          slot,
        )}
    </>
  );
}
