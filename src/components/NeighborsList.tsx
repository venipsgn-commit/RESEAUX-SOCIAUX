'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import { formatDistance } from '@/lib/types';

type Status = 'none' | 'pending_out' | 'pending_in' | 'accepted';

type Neighbor = {
  user_id: string;
  handle: string;
  display_name: string;
  avatar_emoji: string;
  avatar_url: string | null;
  distance_m: number;
  is_online: boolean;
  status: Status;
  req_id: string | null;
};

export function NeighborsList({ lat, lng, radius = 2000 }: { lat: number; lng: number; radius?: number }) {
  const supabase = createClient();
  const router = useRouter();
  const [list, setList] = useState<Neighbor[] | null>(null);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('neighbors_to_invite', {
      user_lat: lat,
      user_lng: lng,
      radius_m: radius,
    });
    setList((data ?? []) as Neighbor[]);
  }, [supabase, lat, lng, radius]);

  useEffect(() => {
    load();
  }, [load]);

  function patch(userId: string, status: Status) {
    setList((prev) => prev?.map((x) => (x.user_id === userId ? { ...x, status } : x)) ?? null);
  }

  async function invite(n: Neighbor) {
    patch(n.user_id, 'pending_out');
    const { data } = await supabase.rpc('request_follow', { other: n.user_id });
    if (data === 'accepted') {
      patch(n.user_id, 'accepted');
      toast({ icon: '🤝', title: `Vous êtes amis avec ${n.handle} !` });
    } else {
      toast({ icon: '👋', title: 'Invitation envoyée !', text: `à ${n.handle}` });
    }
  }

  async function accept(n: Neighbor) {
    if (!n.req_id) return;
    patch(n.user_id, 'accepted');
    await supabase.rpc('respond_follow', { req_id: n.req_id, accept: true });
    toast({ icon: '🤝', title: `Connecté avec ${n.handle} !` });
  }

  async function message(n: Neighbor) {
    const { data } = await supabase.rpc('get_or_create_dm', { other: n.user_id });
    if (data) router.push(`/messages/${data}`);
  }

  if (list === null) {
    return <div className="py-10 text-center text-sm text-ink-700/50">Chargement des voisins…</div>;
  }

  const shown = q.trim()
    ? list.filter((n) => `${n.display_name} ${n.handle}`.toLowerCase().includes(q.toLowerCase()))
    : list;

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 Rechercher un voisin…"
        className="w-full bg-white rounded-full px-4 py-2.5 text-sm outline-none border border-ink-900/10 shadow-soft mb-3"
      />

      {shown.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-2">🏘️</div>
          <p className="text-sm font-bold">Aucun voisin trouvé.</p>
          <p className="text-xs text-ink-700/55 mt-1">
            Les voisins de démo sont autour de Bastille, Paris.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {shown.map((n) => (
            <div
              key={n.user_id}
              className="flex items-center gap-3 py-2 px-2 rounded-2xl hover:bg-white/60 transition"
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-xl overflow-hidden">
                  {n.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={n.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    n.avatar_emoji
                  )}
                </div>
                {n.is_online && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-forest-500 rounded-full border-2 border-cream-50" />
                )}
              </div>

              <Link href={`/u/${n.handle}`} className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{n.display_name || n.handle}</div>
                <div className="text-[11px] text-ink-700/50 truncate">
                  @{n.handle} · à {formatDistance(n.distance_m)}
                  {n.is_online ? ' · en ligne' : ''}
                </div>
              </Link>

              {n.status === 'accepted' ? (
                <button
                  onClick={() => message(n)}
                  className="flex-shrink-0 px-3.5 py-2 bg-sand-200 text-ink-900 rounded-full text-xs font-bold shadow-soft"
                >
                  💬 Message
                </button>
              ) : n.status === 'pending_out' ? (
                <button
                  disabled
                  className="flex-shrink-0 px-3.5 py-2 bg-sand-100 text-ink-700/50 rounded-full text-xs font-bold"
                >
                  ⏳ Envoyée
                </button>
              ) : n.status === 'pending_in' ? (
                <button
                  onClick={() => accept(n)}
                  className="flex-shrink-0 px-3.5 py-2 bg-forest-500 text-white rounded-full text-xs font-bold shadow-soft"
                >
                  ✅ Accepter
                </button>
              ) : (
                <button
                  onClick={() => invite(n)}
                  className="flex-shrink-0 px-3.5 py-2 bg-gradient-to-br from-forest-400 to-forest-600 text-white rounded-full text-xs font-bold shadow-soft"
                >
                  👋 Inviter
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
