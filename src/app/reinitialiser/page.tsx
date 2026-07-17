'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function save() {
    if (pw1.length < 6) {
      setError('6 caractères minimum.');
      return;
    }
    if (pw1 !== pw2) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setBusy(false);
    if (error) setError(error.message);
    else {
      setDone(true);
      setTimeout(() => {
        router.push('/voisinage');
        router.refresh();
      }, 1600);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-cream-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="text-4xl font-black tracking-tight">AURA</div>
          <p className="text-sm text-ink-700/60 mt-1">Nouveau mot de passe</p>
        </div>

        {done ? (
          <div className="bg-surface rounded-3xl p-6 shadow-soft text-center">
            <div className="text-5xl mb-2">✅</div>
            <div className="font-black">Mot de passe modifié !</div>
            <div className="text-sm text-ink-700/60 mt-1">Redirection…</div>
          </div>
        ) : !ready ? (
          <div className="bg-surface rounded-3xl p-6 shadow-soft text-center">
            <div className="text-4xl mb-2">📧</div>
            <div className="font-bold text-sm">Ouvre le lien reçu par e-mail</div>
            <p className="text-xs text-ink-700/55 mt-1">
              Cette page fonctionne quand tu arrives depuis l&apos;e-mail de réinitialisation.
            </p>
            <Link href="/connexion" className="inline-block mt-4 text-xs font-bold text-forest-600">
              ← Retour à la connexion
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-surface rounded-2xl px-4 py-3 shadow-soft border border-ink-900/5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-ink-700/50">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                className="w-full text-sm font-semibold outline-none bg-transparent mt-0.5"
              />
            </div>
            <div className="bg-surface rounded-2xl px-4 py-3 shadow-soft border border-ink-900/5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-ink-700/50">
                Confirme le mot de passe
              </label>
              <input
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                className="w-full text-sm font-semibold outline-none bg-transparent mt-0.5"
              />
            </div>
            {error && (
              <div className="bg-coral-400/10 border border-coral-400/30 rounded-2xl px-4 py-3 text-xs font-semibold text-coral-500">
                {error}
              </div>
            )}
            <button
              onClick={save}
              disabled={busy}
              className="w-full py-3.5 bg-ink-900 text-cream-50 rounded-full font-extrabold text-sm shadow-lift disabled:opacity-50"
            >
              {busy ? '…' : 'Enregistrer le nouveau mot de passe'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
