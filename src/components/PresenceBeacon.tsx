'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getClientPosition } from '@/lib/location';

const TANGENTE_M = 75; // distance en dessous de laquelle deux auras se "touchent"
const PING_MS = 30_000;

type OnlineNeighbor = {
  user_id: string;
  handle: string;
  display_name: string;
  avatar_emoji: string;
  neighbor_score: number;
  distance_m: number;
  seconds_ago: number;
};

/**
 * Publie ma position toutes les 30s (présence live) et récupère les voisins
 * actuellement en ligne dans mon aura. Affiche un compteur live et une
 * alerte "aura tangente" quand un voisin passe à moins de 75m.
 */
export function PresenceBeacon() {
  const router = useRouter();
  const supabase = createClient();
  const [uid, setUid] = useState<string | null>(null);
  const [neighbors, setNeighbors] = useState<OnlineNeighbor[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!uid) return;
    let active = true;

    async function tick() {
      const pos = getClientPosition();
      await supabase.rpc('ping_presence', { p_lat: pos.lat, p_lng: pos.lng });
      const { data } = await supabase.rpc('neighbors_online', {
        user_lat: pos.lat,
        user_lng: pos.lng,
        radius_m: 500,
        since_seconds: 150,
      });
      if (active) setNeighbors((data ?? []) as OnlineNeighbor[]);
    }

    tick();
    const id = setInterval(tick, PING_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  async function contact(neighborId: string) {
    const { data } = await supabase.rpc('get_or_create_dm', { other: neighborId });
    if (data) router.push(`/messages/${data}`);
  }

  if (!uid) return null;

  const tangente = neighbors.find((n) => n.distance_m <= TANGENTE_M && !dismissed.has(n.user_id));

  return (
    <>
      {/* Compteur "en ligne" (haut droite, sous la cloche/filtres) */}
      {neighbors.length > 0 && (
        <div className="absolute top-28 lg:top-32 left-3 lg:left-6 z-30 animate-fade-up">
          <div className="bg-cream-50/95 backdrop-blur-xl rounded-full px-3 py-1.5 shadow-soft flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-forest-500" />
            </span>
            <span className="text-xs font-bold">
              {neighbors.length} voisin{neighbors.length > 1 ? 's' : ''} en ligne près de toi
            </span>
          </div>
        </div>
      )}

      {/* Alerte aura tangente (quelqu'un très proche, maintenant) */}
      {tangente && (
        <div className="absolute bottom-40 lg:bottom-28 left-3 right-3 lg:left-auto lg:right-6 lg:w-96 z-40 animate-fade-up">
          <div
            className="rounded-3xl p-3.5 shadow-lift border border-sunset-500/40"
            style={{ background: 'linear-gradient(135deg,#ffd6a5,#ffb878)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center text-2xl border-2 border-white shadow-pin">
                {tangente.avatar_emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm">{tangente.display_name}</span>
                  <span className="badge-merge">Aura tangente</span>
                </div>
                <div className="text-[11px] text-ink-700/70">
                  À <b>{Math.round(tangente.distance_m)}m</b> de toi, <b>maintenant</b> · Score{' '}
                  {tangente.neighbor_score}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => contact(tangente.user_id)}
                className="flex-1 py-2 bg-ink-900 text-cream-50 rounded-full text-xs font-bold"
              >
                👋 Dire bonjour
              </button>
              <button
                onClick={() => setDismissed((d) => new Set(d).add(tangente.user_id))}
                className="px-3 py-2 bg-white/60 rounded-full text-xs font-bold"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
