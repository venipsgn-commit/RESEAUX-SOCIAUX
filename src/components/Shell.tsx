'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

type TabDef = { href: string; label: string; icon: string };

const TABS: TabDef[] = [
  { href: '/', label: 'Carte', icon: '🗺' },
  { href: '/voisinage', label: 'Voisinage', icon: '🏘' },
  { href: '/compose', label: 'Publier', icon: '＋' },
  { href: '/marche', label: 'Marché', icon: '🛒' },
  { href: '/profil', label: 'Profil', icon: '👤' },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeHref = TABS.find((t) => t.href === pathname)?.href ?? '/';

  return (
    <div className="min-h-[100dvh] bg-cream-50 text-ink-900">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-72 border-r border-ink-900/5 flex-col p-6 bg-cream-50 z-40">
        <Link href="/" className="flex items-center gap-3 mb-10">
          <div className="aura-logo" />
          <span className="text-3xl font-black tracking-tight">aura</span>
        </Link>
        <nav className="flex flex-col gap-1 flex-1">
          {TABS.map((t) => {
            const active = t.href === activeHref;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={clsx(
                  'flex items-center gap-4 px-4 py-3 rounded-2xl text-base font-bold transition',
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
        </nav>
        <div className="bg-sand-100 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 text-white font-black flex items-center justify-center">
              M
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">Marie Dupont</div>
              <div className="text-xs text-ink-700/60">@marie</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="lg:pl-72 pb-[88px] lg:pb-0 min-h-[100dvh]">{children}</main>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-2 pt-3 pb-6 bg-cream-50/95 backdrop-blur-xl border-t border-ink-900/5 shadow-tab">
        <div className="flex items-center justify-around">
          {TABS.map((t) => {
            const active = t.href === activeHref;
            if (t.href === '/compose') {
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-label="Publier"
                  className="-mt-2 w-14 h-14 rounded-2xl text-white text-3xl font-light flex items-center justify-center bg-gradient-to-br from-sunset-500 to-coral-500 shadow-pin"
                >
                  ＋
                </Link>
              );
            }
            return (
              <Link
                key={t.href}
                href={t.href}
                className={clsx(
                  'flex-1 h-12 flex flex-col items-center justify-center gap-0.5 transition',
                  active ? 'text-ink-900' : 'text-ink-700/40',
                )}
              >
                <span className="text-[22px] leading-none">{t.icon}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
