'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { LocationGate } from './LocationGate';
import { NotifWatcher } from './NotifWatcher';
import { MessagesBadge } from './MessagesBadge';
import { CallProvider } from './CallProvider';

type TabDef = { href: string; label: string; icon: string };

const NAV = {
  carte: { href: '/', label: 'Carte', icon: '🗺' },
  voisinage: { href: '/voisinage', label: 'Voisinage', icon: '🏘' },
  compose: { href: '/compose', label: 'Publier', icon: '＋' },
  reels: { href: '/reels', label: 'Réels', icon: '🎬' },
  messages: { href: '/messages', label: 'Messages', icon: '💬' },
  profil: { href: '/profil', label: 'Profil', icon: '👤' },
  marche: { href: '/marche', label: 'Marché', icon: '🛒' },
};

// Mobile : ＋ au centre (index 3), un peu plus grand
const MOBILE_TABS: TabDef[] = [
  NAV.carte,
  NAV.voisinage,
  NAV.marche,
  NAV.compose,
  NAV.reels,
  NAV.messages,
  NAV.profil,
];
// Desktop : Messages/Notifications gérés à part (badge)
const DESKTOP_TABS: TabDef[] = [NAV.carte, NAV.voisinage, NAV.compose, NAV.marche, NAV.reels];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Navigation optimiste : dès qu'on clique, on met en surbrillance la cible
  // et on affiche la barre de progression, sans attendre le serveur.
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => setPending(null), [pathname]);

  const current = pending ?? pathname;
  const navigating = pending !== null && pending !== pathname;
  const isActive = (href: string) =>
    href === '/' ? current === '/' : current === href || current.startsWith(href + '/');

  const go = (href: string) => (href === pathname ? undefined : setPending(href));

  return (
    <CallProvider>
    <div className="min-h-[100dvh] bg-cream-50 text-ink-900">
      {/* Barre de progression de navigation */}
      <div
        aria-hidden
        className={clsx(
          'fixed top-0 left-0 h-0.5 z-[999] bg-gradient-to-r from-forest-500 to-sunset-500 transition-all duration-300 ease-out',
          navigating ? 'w-4/5 opacity-100' : 'w-0 opacity-0',
        )}
      />
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-72 border-r border-ink-900/5 flex-col p-6 bg-cream-50 z-40">
        <Link href="/" className="flex items-center gap-3 mb-10">
          <div className="aura-logo" />
          <span className="text-3xl font-black tracking-tight">aura</span>
        </Link>
        <nav className="flex flex-col gap-1 flex-1">
          {/* Le profil est accessible via la carte "Mon profil" en bas. */}
          {DESKTOP_TABS.map((t) => {
            const active = isActive(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                onClick={() => go(t.href)}
                className={clsx(
                  'flex items-center gap-4 px-4 py-3 rounded-2xl text-base font-bold transition active:scale-[0.98]',
                  active
                    ? 'bg-ink-900 text-cream-50 shadow-soft'
                    : 'text-ink-700/70 hover:bg-sand-100 hover:text-ink-900',
                )}
              >
                <span className="text-2xl">{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            );
          })}
          <Link
            href="/messages"
            onClick={() => go('/messages')}
            className={clsx(
              'flex items-center gap-4 px-4 py-3 rounded-2xl text-base font-bold transition active:scale-[0.98]',
              current.startsWith('/messages')
                ? 'bg-ink-900 text-cream-50 shadow-soft'
                : 'text-ink-700/70 hover:bg-sand-100 hover:text-ink-900',
            )}
          >
            <span className="relative text-2xl">
              💬
              <MessagesBadge />
            </span>
            <span>Messages</span>
          </Link>
          <Link
            href="/notifications"
            onClick={() => go('/notifications')}
            className={clsx(
              'flex items-center gap-4 px-4 py-3 rounded-2xl text-base font-bold transition active:scale-[0.98]',
              current.startsWith('/notifications')
                ? 'bg-ink-900 text-cream-50 shadow-soft'
                : 'text-ink-700/70 hover:bg-sand-100 hover:text-ink-900',
            )}
          >
            <span className="text-2xl">🔔</span>
            <span>Notifications</span>
          </Link>
        </nav>
        <Link href="/profil" className="bg-sand-100 rounded-2xl p-4 hover:bg-sand-200 transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 text-white flex items-center justify-center text-lg">
              📍
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">Mon profil</div>
              <div className="text-xs text-ink-700/60">Compte & réglages</div>
            </div>
          </div>
        </Link>
      </aside>

      {/* MAIN */}
      <main className="lg:pl-72 pb-[88px] lg:pb-0 min-h-[100dvh]">{children}</main>

      {/* Bannière géolocalisation (invisible une fois la position choisie) */}
      <LocationGate />

      {/* Son + bandeau à l'arrivée d'une notification (global, toutes pages) */}
      <NotifWatcher />

      {/* MOBILE BOTTOM TAB BAR */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-1.5 pt-2 pb-[max(env(safe-area-inset-bottom),16px)] bg-cream-50/95 backdrop-blur-xl border-t border-ink-900/5 shadow-tab">
        <div className="flex items-end justify-around">
          {MOBILE_TABS.map((t) => {
            const active = isActive(t.href);
            if (t.href === '/compose') {
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={() => go(t.href)}
                  aria-label="Publier"
                  className="-mt-6 mx-0.5 w-14 h-14 rounded-[18px] text-white text-3xl font-light flex items-center justify-center bg-gradient-to-br from-sunset-500 to-coral-500 shadow-pin active:scale-95 transition flex-shrink-0 border-4 border-cream-50"
                >
                  ＋
                </Link>
              );
            }
            return (
              <Link
                key={t.href}
                href={t.href}
                onClick={() => go(t.href)}
                className="flex-1 min-w-0 flex flex-col items-center gap-0.5 pt-1 active:scale-95 transition"
              >
                <span
                  className={clsx(
                    'relative w-10 h-7 rounded-2xl flex items-center justify-center text-[19px] leading-none transition-colors',
                    active ? 'bg-forest-500/15 text-forest-600' : 'text-ink-700/45',
                  )}
                >
                  {t.icon}
                  {t.href === '/messages' && <MessagesBadge />}
                </span>
                <span
                  className={clsx(
                    'text-[8.5px] font-extrabold tracking-tight leading-none',
                    active ? 'text-forest-600' : 'text-ink-700/45',
                  )}
                >
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
    </CallProvider>
  );
}
