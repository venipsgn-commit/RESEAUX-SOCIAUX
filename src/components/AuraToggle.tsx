'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

/**
 * Interrupteur AURA : active (visible par les voisins) ou en pause (invisible
 * sur la carte / la liste des voisins). Réutilise le drapeau `is_private`.
 */
export function AuraToggle({ initialActive, radius }: { initialActive: boolean; radius: number }) {
  const supabase = createClient();
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !active;
    setActive(next);
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ is_private: !next }).eq('id', user.id);
    }
    setBusy(false);
    toast(
      next
        ? { icon: '📡', title: 'Aura activée', text: 'Tu es visible par tes voisins.' }
        : { icon: '🌙', title: 'Aura en pause', text: 'Tu es invisible sur la carte.' },
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-soft border border-ink-900/5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-extrabold">📡 Mon AURA</div>
          <div className="text-[11px] text-ink-700/55">
            {active ? (
              <>
                Active · visible dans <b className="text-forest-600">{radius} m</b>
              </>
            ) : (
              'En pause · invisible sur la carte'
            )}
          </div>
        </div>
        <button
          onClick={toggle}
          aria-label={active ? "Désactiver l'aura" : "Activer l'aura"}
          className={`flex-shrink-0 w-12 h-7 rounded-full relative transition ${
            active ? 'bg-forest-500' : 'bg-ink-900/15'
          }`}
        >
          <span
            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-soft transition-all ${
              active ? 'right-0.5' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between bg-sand-100 rounded-xl px-3 py-2.5">
        <div className="text-[11px] font-bold text-ink-700/60">
          {active ? '🟢 Tu apparais dans ton quartier' : '⚪ Personne ne te voit'}
        </div>
        <Link href="/profil/modifier" className="text-[11px] font-black text-forest-600">
          Régler le rayon →
        </Link>
      </div>
    </div>
  );
}
