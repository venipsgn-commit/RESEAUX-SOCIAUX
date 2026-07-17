'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AURA_POS_COOKIE, serializePositionCookie, type AuraPosition } from '@/lib/location';

const EMOJIS = ['📍', '😊', '🌻', '🎨', '🔧', '🥖', '🚀', '🐱', '🐶', '🌊', '⚽', '🎸', '📚', '☕', '🌸', '🦊'];

function writeCookie(pos: AuraPosition) {
  document.cookie = `${AURA_POS_COOKIE}=${serializePositionCookie(pos)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      { headers: { 'Accept-Language': 'fr' } },
    );
    const data = await res.json();
    const a = data?.address ?? {};
    const q = a.neighbourhood || a.suburb || a.quarter || a.city_district || a.village || a.town;
    const v = a.city || a.town || a.municipality || a.county;
    if (q && v && q !== v) return `${q} · ${v}`;
    return q || v || 'Ma position';
  } catch {
    return 'Ma position';
  }
}

export default function BienvenuePage() {
  const supabase = createClient();
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📍');
  const [quartier, setQuartier] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      if (!u) {
        router.push('/connexion');
        return;
      }
      setUid(u.id);
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name, handle, avatar_emoji')
        .eq('id', u.id)
        .single();
      if (prof) {
        setName(prof.display_name || prof.handle || '');
        if (prof.avatar_emoji) setEmoji(prof.avatar_emoji);
      }
    });
  }, [supabase, router]);

  function activateLocation() {
    if (!('geolocation' in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const { latitude, longitude } = p.coords;
        writeCookie({ lat: latitude, lng: longitude, quartier: 'Ma position', real: true });
        const q = await reverseGeocode(latitude, longitude);
        writeCookie({ lat: latitude, lng: longitude, quartier: q, real: true });
        setQuartier(q);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  async function finish() {
    if (!uid || saving) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ onboarded: true, avatar_emoji: emoji, display_name: name.trim() || null })
      .eq('id', uid);
    router.push('/voisinage');
    router.refresh();
  }

  return (
    <div className="min-h-[100dvh] bg-cream-50 flex flex-col px-5 py-10">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col">
        <div className="text-center mb-6">
          <div className="text-4xl font-black tracking-tight">AURA</div>
          <p className="hand text-xl text-coral-500 mt-1">Bienvenue dans ton quartier !</p>
        </div>

        {/* Étape 1 — position */}
        <div className="bg-white rounded-2xl p-4 shadow-soft border border-ink-900/5">
          <div className="font-extrabold text-sm">📍 Active ta position</div>
          <p className="text-[12px] text-ink-700/60 mt-0.5">
            AURA te montre les voisins et annonces <b>autour de toi</b>. Ta position reste privée.
          </p>
          {quartier ? (
            <div className="mt-3 bg-forest-500/10 text-forest-700 rounded-xl px-3 py-2.5 text-sm font-bold">
              ✓ {quartier}
            </div>
          ) : (
            <button
              onClick={activateLocation}
              disabled={locating}
              className="mt-3 w-full py-2.5 bg-forest-500 text-white rounded-full font-extrabold text-sm shadow-soft disabled:opacity-60"
            >
              {locating ? 'Localisation…' : '📍 Activer ma position'}
            </button>
          )}
        </div>

        {/* Étape 2 — avatar + nom */}
        <div className="bg-white rounded-2xl p-4 shadow-soft border border-ink-900/5 mt-3">
          <div className="font-extrabold text-sm">😊 Ton profil</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ton nom affiché"
            className="mt-2.5 w-full bg-cream-50 rounded-2xl px-4 py-3 text-sm outline-none border border-ink-900/10"
          />
          <div className="grid grid-cols-8 gap-1.5 mt-3">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`aspect-square rounded-xl text-xl flex items-center justify-center ${
                  emoji === e ? 'bg-forest-500/15 ring-2 ring-forest-500' : 'bg-cream-50 border border-ink-900/5'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        <button
          onClick={finish}
          disabled={saving}
          className="mt-6 w-full py-3.5 bg-ink-900 text-cream-50 rounded-full font-extrabold text-sm shadow-lift disabled:opacity-50"
        >
          {saving ? '…' : "C'est parti ! 🚀"}
        </button>
        <button
          onClick={finish}
          className="mt-2 w-full text-center text-xs font-bold text-ink-700/45"
        >
          Passer
        </button>
      </div>
    </div>
  );
}
