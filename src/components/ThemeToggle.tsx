'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    try {
      localStorage.setItem('aura_theme', next ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="bg-surface rounded-2xl p-4 shadow-soft border border-ink-900/5 flex items-center justify-between">
      <div>
        <div className="text-sm font-extrabold">{dark ? '🌙 Mode sombre' : '☀️ Mode clair'}</div>
        <div className="text-[11px] text-ink-700/55">Change l&apos;apparence d&apos;AURA</div>
      </div>
      <button
        onClick={toggle}
        aria-label="Basculer le thème"
        className={`flex-shrink-0 w-12 h-7 rounded-full relative transition ${
          dark ? 'bg-forest-500' : 'bg-ink-900/15'
        }`}
      >
        <span
          className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-soft transition-all ${
            dark ? 'right-0.5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}
