'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

const EMOJIS = ['📍', '😊', '🌻', '🎨', '🔧', '🥖', '🚀', '🐱', '🐶', '🌊', '⚽', '🎸', '📚', '☕', '🌸', '🦊', '🍕', '🎯', '💡', '🌙'];

type EditProfile = {
  id: string;
  display_name: string | null;
  avatar_emoji: string;
  bio: string | null;
  tagline: string | null;
  aura_radius_m: number;
  is_pro: boolean;
};

function fmtRadius(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)} km` : `${m} m`;
}

export function ProfileEditForm({ profile }: { profile: EditProfile }) {
  const supabase = createClient();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [emoji, setEmoji] = useState(profile.avatar_emoji ?? '📍');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [tagline, setTagline] = useState(profile.tagline ?? '');
  const [radius, setRadius] = useState(profile.aura_radius_m ?? 500);
  const [isPro, setIsPro] = useState(profile.is_pro ?? false);
  const [saving, setSaving] = useState(false);

  const maxRadius = isPro ? 2000 : 1000;

  async function goPro() {
    setIsPro(true);
    await supabase.from('profiles').update({ is_pro: true }).eq('id', profile.id);
    toast({ icon: '🚀', title: 'Bienvenue dans AURA Pro !', text: 'Aura jusqu’à 2 km débloquée.' });
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || null,
        avatar_emoji: emoji,
        bio: bio.trim() || null,
        tagline: tagline.trim() || null,
        aura_radius_m: Math.min(radius, maxRadius),
      })
      .eq('id', profile.id);
    setSaving(false);
    if (!error) {
      toast({ icon: '✅', title: 'Profil mis à jour !' });
      router.push('/profil');
      router.refresh();
    } else {
      toast({ icon: '⚠️', title: 'Oups', text: "Les modifications n'ont pas été enregistrées." });
    }
  }

  return (
    <div className="space-y-5">
      {/* Avatar emoji */}
      <div>
        <label className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50">
          Avatar (emoji de secours)
        </label>
        <div className="grid grid-cols-10 gap-1.5 mt-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`aspect-square rounded-xl text-xl flex items-center justify-center transition ${
                emoji === e ? 'bg-forest-500/15 ring-2 ring-forest-500' : 'bg-white border border-ink-900/5'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Nom */}
      <div>
        <label className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50">Nom affiché</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          placeholder="Ton nom"
          className="mt-1.5 w-full bg-white rounded-2xl px-4 py-3 text-sm outline-none border border-ink-900/10 shadow-soft"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="Parle un peu de toi…"
          className="mt-1.5 w-full bg-white rounded-2xl px-4 py-3 text-sm outline-none border border-ink-900/10 shadow-soft resize-none"
        />
      </div>

      {/* Tagline */}
      <div>
        <label className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50">
          Petite phrase
        </label>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={60}
          placeholder="Ta devise, ton humeur…"
          className="mt-1.5 w-full bg-white rounded-2xl px-4 py-3 text-sm outline-none border border-ink-900/10 shadow-soft"
        />
      </div>

      {/* Rayon de l'aura */}
      <div className="bg-white rounded-2xl p-4 shadow-soft border border-ink-900/5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-extrabold">📡 Rayon de mon aura</label>
          <span className="text-forest-600 font-black">{fmtRadius(radius)}</span>
        </div>
        <input
          type="range"
          min={100}
          max={maxRadius}
          step={50}
          value={Math.min(radius, maxRadius)}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="mt-3 w-full accent-forest-500"
        />
        <div className="flex justify-between text-[10px] font-bold text-ink-700/50 mt-1">
          <span>100 m</span>
          <span>{isPro ? '2 km (Pro)' : '1 km'}</span>
        </div>

        {!isPro ? (
          <div className="mt-3 bg-gradient-to-br from-sunset-300/40 to-sunset-500/15 rounded-2xl p-3.5 border border-sunset-500/20">
            <div className="font-extrabold text-sm">🚀 AURA Pro</div>
            <div className="text-xs text-ink-700/70 mt-0.5">
              Étends ton aura <b>jusqu&apos;à 2 km</b> et touche encore plus de voisins.
            </div>
            <button
              onClick={goPro}
              className="mt-2.5 px-4 py-2 bg-ink-900 text-cream-50 rounded-full text-xs font-bold shadow-soft"
            >
              Devenir Pro
            </button>
          </div>
        ) : (
          <div className="mt-2.5 text-xs font-bold text-forest-600">
            ✓ Compte Pro — aura jusqu&apos;à 2 km débloquée
          </div>
        )}
      </div>

      {/* Enregistrer */}
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3.5 bg-gradient-to-br from-forest-400 to-forest-600 text-white rounded-full font-extrabold shadow-lift disabled:opacity-60"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  );
}
