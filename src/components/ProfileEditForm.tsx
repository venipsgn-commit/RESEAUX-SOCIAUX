'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import { ThemeToggle } from '@/components/ThemeToggle';

type Blocked = { user_id: string; handle: string; display_name: string | null; avatar_emoji: string };

const EMOJIS = ['📍', '😊', '🌻', '🎨', '🔧', '🥖', '🚀', '🐱', '🐶', '🌊', '⚽', '🎸', '📚', '☕', '🌸', '🦊', '🍕', '🎯', '💡', '🌙'];

type EditProfile = {
  id: string;
  display_name: string | null;
  avatar_emoji: string;
  bio: string | null;
  tagline: string | null;
  aura_radius_m: number;
  visibility_radius_m: number;
  is_pro: boolean;
  is_private: boolean;
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
  const [visRadius, setVisRadius] = useState(profile.visibility_radius_m ?? 10000);
  const [isPro, setIsPro] = useState(profile.is_pro ?? false);
  const [isPrivate, setIsPrivate] = useState(profile.is_private ?? false);
  const [saving, setSaving] = useState(false);
  // Changement de mot de passe
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.rpc('my_blocked').then(({ data }) => setBlocked((data ?? []) as Blocked[]));
  }, [supabase]);

  async function unblock(id: string, handle: string) {
    setBlocked((b) => b.filter((x) => x.user_id !== id));
    await supabase.rpc('unblock_user', { other: id });
    toast({ icon: '✅', title: `@${handle} débloqué·e` });
  }

  async function deleteAccount() {
    if (deleting) return;
    setDeleting(true);
    const { error } = await supabase.rpc('delete_my_account');
    if (error) {
      setDeleting(false);
      toast({ icon: '⚠️', title: 'Oups', text: 'La suppression a échoué.' });
      return;
    }
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  async function changePassword() {
    if (pwBusy) return;
    if (pw1.length < 6) {
      toast({ icon: '⚠️', title: 'Mot de passe trop court', text: '6 caractères minimum.' });
      return;
    }
    if (pw1 !== pw2) {
      toast({ icon: '⚠️', title: 'Les mots de passe ne correspondent pas' });
      return;
    }
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setPwBusy(false);
    if (!error) {
      setPw1('');
      setPw2('');
      toast({ icon: '🔐', title: 'Mot de passe modifié !' });
    } else {
      toast({ icon: '⚠️', title: 'Oups', text: 'Le mot de passe n’a pas pu être changé.' });
    }
  }

  const maxRadius = isPro ? 10000 : 1000;

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
        visibility_radius_m: visRadius,
        is_private: isPrivate,
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
      {/* Thème clair / sombre */}
      <ThemeToggle />

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
                emoji === e ? 'bg-forest-500/15 ring-2 ring-forest-500' : 'bg-surface border border-ink-900/5'
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
          className="mt-1.5 w-full bg-surface rounded-2xl px-4 py-3 text-sm outline-none border border-ink-900/10 shadow-soft"
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
          className="mt-1.5 w-full bg-surface rounded-2xl px-4 py-3 text-sm outline-none border border-ink-900/10 shadow-soft resize-none"
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
          className="mt-1.5 w-full bg-surface rounded-2xl px-4 py-3 text-sm outline-none border border-ink-900/10 shadow-soft"
        />
      </div>

      {/* Rayon de l'aura */}
      <div className="bg-surface rounded-2xl p-4 shadow-soft border border-ink-900/5">
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
          <span>{isPro ? '10 km (Pro)' : '1 km'}</span>
        </div>

        {!isPro ? (
          <div className="mt-3 bg-gradient-to-br from-sunset-300/40 to-sunset-500/15 rounded-2xl p-3.5 border border-sunset-500/20">
            <div className="font-extrabold text-sm">🚀 AURA Pro</div>
            <div className="text-xs text-ink-700/70 mt-0.5">
              Étends ton aura <b>jusqu&apos;à 10 km</b> et touche encore plus de voisins.
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
            ✓ Compte Pro — aura jusqu&apos;à 10 km débloquée 🚀
          </div>
        )}
      </div>

      {/* Rayon de visibilité (qui peut me voir) */}
      <div className="bg-surface rounded-2xl p-4 shadow-soft border border-ink-900/5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-extrabold">👁️ Qui peut me voir</label>
          <span className="text-forest-600 font-black">{fmtRadius(visRadius)}</span>
        </div>
        <div className="text-[11px] text-ink-700/55 mt-0.5">
          Les voisins ne te voient sur la carte que dans ce rayon autour de toi.
        </div>
        <input
          type="range"
          min={100}
          max={10000}
          step={100}
          value={visRadius}
          onChange={(e) => setVisRadius(Number(e.target.value))}
          className="mt-3 w-full accent-forest-500"
        />
        <div className="flex justify-between text-[10px] font-bold text-ink-700/50 mt-1">
          <span>100 m</span>
          <span>10 km (max)</span>
        </div>
      </div>

      {/* Confidentialité */}
      <div className="bg-surface rounded-2xl p-4 shadow-soft border border-ink-900/5">
        <button
          onClick={() => setIsPrivate((v) => !v)}
          className="w-full flex items-center justify-between gap-3"
        >
          <div className="text-left">
            <div className="text-sm font-extrabold flex items-center gap-1.5">🔒 Profil privé</div>
            <div className="text-[11px] text-ink-700/60 mt-0.5">
              Tu restes <b>invisible</b> sur la carte et dans la liste des voisins. Tu peux quand
              même publier et discuter.
            </div>
          </div>
          <span
            className={`flex-shrink-0 w-11 h-6 rounded-full relative transition ${
              isPrivate ? 'bg-forest-500' : 'bg-ink-900/15'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-surface rounded-full shadow-soft transition-all ${
                isPrivate ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </span>
        </button>
      </div>

      {/* Enregistrer le profil */}
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3.5 bg-gradient-to-br from-forest-400 to-forest-600 text-white rounded-full font-extrabold shadow-lift disabled:opacity-60"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>

      {/* Changer de mot de passe */}
      <div className="bg-surface rounded-2xl p-4 shadow-soft border border-ink-900/5">
        <div className="text-sm font-extrabold mb-2">🔐 Changer de mot de passe</div>
        <input
          type="password"
          value={pw1}
          onChange={(e) => setPw1(e.target.value)}
          placeholder="Nouveau mot de passe"
          className="w-full bg-cream-50 rounded-2xl px-4 py-3 text-sm outline-none border border-ink-900/10 mb-2"
        />
        <input
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          placeholder="Confirme le mot de passe"
          className="w-full bg-cream-50 rounded-2xl px-4 py-3 text-sm outline-none border border-ink-900/10"
        />
        <button
          onClick={changePassword}
          disabled={pwBusy || !pw1 || !pw2}
          className="mt-3 w-full py-3 bg-ink-900 text-cream-50 rounded-full font-extrabold text-sm disabled:opacity-50"
        >
          {pwBusy ? '…' : 'Mettre à jour le mot de passe'}
        </button>
      </div>

      {/* Comptes bloqués */}
      {blocked.length > 0 && (
        <div className="bg-surface rounded-2xl p-4 shadow-soft border border-ink-900/5">
          <div className="text-sm font-extrabold mb-2">🚫 Comptes bloqués</div>
          <div className="space-y-1">
            {blocked.map((b) => (
              <div key={b.user_id} className="flex items-center gap-3 py-1.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-base flex-shrink-0">
                  {b.avatar_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{b.display_name || b.handle}</div>
                  <div className="text-[11px] text-ink-700/50 truncate">@{b.handle}</div>
                </div>
                <button
                  onClick={() => unblock(b.user_id, b.handle)}
                  className="px-3 py-1.5 bg-sand-200 text-ink-900 rounded-full text-xs font-bold"
                >
                  Débloquer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidentialité */}
      <Link
        href="/confidentialite"
        className="flex items-center justify-between bg-surface rounded-2xl px-4 py-3.5 shadow-soft border border-ink-900/5"
      >
        <span className="text-sm font-extrabold">🔏 Confidentialité & données (RGPD)</span>
        <span className="text-ink-700/40 text-lg">→</span>
      </Link>

      {/* Zone dangereuse — supprimer le compte */}
      <div className="bg-coral-500/5 rounded-2xl p-4 border border-coral-500/20">
        <div className="text-sm font-extrabold text-coral-500">Supprimer mon compte</div>
        <p className="text-[12px] text-ink-700/60 mt-0.5">
          Efface définitivement ton compte et toutes tes données (annonces, messages, stories…).
          Irréversible.
        </p>
        {confirmDelete ? (
          <div className="flex gap-2 mt-3">
            <button
              onClick={deleteAccount}
              disabled={deleting}
              className="flex-1 py-2.5 bg-coral-500 text-white rounded-full font-extrabold text-sm disabled:opacity-60"
            >
              {deleting ? 'Suppression…' : 'Oui, supprimer définitivement'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2.5 bg-sand-200 text-ink-900 rounded-full font-bold text-sm"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="mt-3 w-full py-2.5 border-2 border-coral-500 text-coral-500 rounded-full font-extrabold text-sm"
          >
            Supprimer mon compte
          </button>
        )}
      </div>
    </div>
  );
}
