'use client';

import { useEffect, useState } from 'react';
import type { ToastData } from '@/lib/toast';

type T = ToastData & { id: number };

export function Toaster() {
  const [toasts, setToasts] = useState<T[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const d = (e as CustomEvent).detail as ToastData;
      const id = performance.now();
      setToasts((t) => [...t, { id, ...d }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    };
    window.addEventListener('aura-toast', onToast);
    return () => window.removeEventListener('aura-toast', onToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2 items-center w-[calc(100%-1.5rem)] max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto w-full bg-ink-900 text-cream-50 rounded-2xl shadow-lift px-4 py-3 flex items-center gap-3 animate-fade-up border border-cream-50/10"
        >
          {t.icon && (
            <span className="w-10 h-10 rounded-full bg-forest-500/25 flex items-center justify-center text-xl flex-shrink-0">
              {t.icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm">{t.title}</div>
            {t.text && <div className="text-xs text-cream-50/70 leading-snug">{t.text}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
