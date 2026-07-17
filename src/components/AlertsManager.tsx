'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getClientPosition } from '@/lib/location';
import { toast } from '@/lib/toast';

type Alert = { id: string; keyword: string; radius_m: number };

export function AlertsManager() {
  const supabase = createClient();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [keyword, setKeyword] = useState('');
  const [radius, setRadius] = useState(1000);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase
      .from('post_alerts')
      .select('id, keyword, radius_m')
      .order('created_at', { ascending: false });
    setAlerts((data ?? []) as Alert[]);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    const kw = keyword.trim();
    if (!kw || busy) return;
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/connexion');
      return;
    }
    const p = getClientPosition();
    const { error } = await supabase.from('post_alerts').insert({
      user_id: user.id,
      keyword: kw,
      lat: p.lat,
      lng: p.lng,
      radius_m: radius,
    });
    setBusy(false);
    if (!error) {
      setKeyword('');
      toast({ icon: '🔔', title: 'Alerte créée !', text: `On te prévient pour « ${kw} » près de toi.` });
      load();
    } else {
      toast({ icon: '⚠️', title: 'Oups', text: "L'alerte n'a pas pu être créée." });
    }
  }

  async function remove(id: string) {
    setAlerts((a) => a?.filter((x) => x.id !== id) ?? null);
    await supabase.from('post_alerts').delete().eq('id', id);
  }

  return (
    <div>
      <div className="bg-surface rounded-2xl p-4 shadow-soft border border-ink-900/5">
        <div className="text-sm font-extrabold">🔔 Nouvelle alerte</div>
        <p className="text-[12px] text-ink-700/60 mt-0.5">
          Reçois une notification dès qu&apos;une annonce contenant ton mot apparaît près de toi.
        </p>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          maxLength={40}
          placeholder="Mot-clé (ex : vélo, canapé, baby-sitting…)"
          className="mt-3 w-full bg-cream-50 rounded-2xl px-4 py-3 text-sm outline-none border border-ink-900/10"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] font-bold text-ink-700/55">
            Rayon : {radius >= 1000 ? `${radius / 1000} km` : `${radius} m`}
          </span>
          <input
            type="range"
            min={200}
            max={5000}
            step={100}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-1/2 accent-forest-500"
          />
        </div>
        <button
          onClick={create}
          disabled={busy || !keyword.trim()}
          className="mt-3 w-full py-3 bg-gradient-to-br from-forest-400 to-forest-600 text-white rounded-full font-extrabold text-sm shadow-soft disabled:opacity-50"
        >
          Créer l&apos;alerte
        </button>
      </div>

      <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mt-5 mb-2">
        Mes alertes
      </div>
      {alerts === null ? (
        <div className="py-6 text-center text-sm text-ink-700/50">Chargement…</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-sm text-ink-700/55">Aucune alerte pour l&apos;instant.</div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 bg-surface rounded-2xl px-4 py-3 shadow-soft border border-ink-900/5"
            >
              <span className="text-lg">🔔</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">« {a.keyword} »</div>
                <div className="text-[11px] text-ink-700/50">
                  dans {a.radius_m >= 1000 ? `${a.radius_m / 1000} km` : `${a.radius_m} m`}
                </div>
              </div>
              <button
                onClick={() => remove(a.id)}
                className="px-3 py-1.5 bg-sand-200 text-ink-900 rounded-full text-xs font-bold"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
