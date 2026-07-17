'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase/client';

type Mode = 'login' | 'signup';

export default function ConnexionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      if (mode === 'signup') {
        const cleanHandle = handle.toLowerCase().trim();
        if (!/^[a-z0-9_]{3,30}$/.test(cleanHandle)) {
          setError('Le pseudo doit faire 3 à 30 caractères (lettres, chiffres, _).');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { handle: cleanHandle, display_name: displayName.trim() || cleanHandle },
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push('/voisinage');
          router.refresh();
        } else {
          // Pas de session renvoyée (confirmation email activée côté config) :
          // l'email est auto-confirmé par un trigger, donc on se connecte direct.
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) {
            setInfo('Compte créé ! Tu peux maintenant te connecter.');
            setMode('login');
          } else {
            router.push('/voisinage');
            router.refresh();
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/voisinage');
        router.refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(
        message.includes('Invalid login credentials')
          ? 'Email ou mot de passe incorrect.'
          : message.includes('already registered')
            ? 'Cet email a déjà un compte. Connecte-toi.'
            : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-cream-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center mb-3 shadow-lift">
              <div className="absolute inset-0 rounded-full bg-forest-400 animate-ping-slow opacity-30" />
              <div className="relative w-4 h-4 rounded-full bg-white" />
            </div>
            <div className="text-4xl font-black tracking-tight">AURA</div>
            <p className="hand text-xl text-coral-500 mt-1">Ton quartier, enfin vivant.</p>
          </div>

          {/* Tabs */}
          <div className="bg-sand-100 rounded-full p-1 flex mb-5">
            {(['signup', 'login'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={clsx(
                  'flex-1 py-2.5 rounded-full text-sm font-bold transition',
                  mode === m ? 'bg-ink-900 text-cream-50 shadow-soft' : 'text-ink-700/60',
                )}
              >
                {m === 'signup' ? 'Rejoindre' : 'Connexion'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && (
              <>
                <div className="bg-white rounded-2xl px-4 py-3 shadow-soft border border-ink-900/5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-ink-700/50">
                    Pseudo (@)
                  </label>
                  <input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="marie_bastille"
                    required
                    className="w-full text-sm font-semibold outline-none bg-transparent mt-0.5"
                  />
                </div>
                <div className="bg-white rounded-2xl px-4 py-3 shadow-soft border border-ink-900/5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-ink-700/50">
                    Nom affiché
                  </label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Marie Dupont"
                    className="w-full text-sm font-semibold outline-none bg-transparent mt-0.5"
                  />
                </div>
              </>
            )}
            <div className="bg-white rounded-2xl px-4 py-3 shadow-soft border border-ink-900/5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-ink-700/50">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marie@exemple.fr"
                required
                className="w-full text-sm font-semibold outline-none bg-transparent mt-0.5"
              />
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-soft border border-ink-900/5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-ink-700/50">
                Mot de passe {mode === 'signup' && '(8+ caractères)'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className="w-full text-sm font-semibold outline-none bg-transparent mt-0.5"
              />
            </div>

            {error && (
              <div className="bg-coral-400/10 border border-coral-400/30 rounded-2xl px-4 py-3 text-xs font-semibold text-coral-500">
                {error}
              </div>
            )}
            {info && (
              <div className="bg-sage-200/60 border border-forest-400/30 rounded-2xl px-4 py-3 text-xs font-semibold text-forest-600">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-ink-900 text-cream-50 rounded-full font-extrabold text-sm shadow-lift disabled:opacity-50 hover:scale-[1.01] transition"
            >
              {loading ? '…' : mode === 'signup' ? '📍 Activer mon AURA' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-[11px] text-ink-700/40 mt-6">
            100% RGPD · Localisation chiffrée · Open-source
          </p>
          <p className="text-center mt-3">
            <Link href="/" className="text-xs font-bold text-forest-600">
              ← Explorer sans compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
