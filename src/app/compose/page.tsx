'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Shell } from '@/components/Shell';
import clsx from 'clsx';

const TYPES = [
  { id: 'sell', icon: '🛒', label: 'Vendre', color: 'sunset-500' },
  { id: 'service', icon: '🛠', label: 'Service', color: 'coral-500' },
  { id: 'event', icon: '🎉', label: 'Event', color: 'sage-400' },
  { id: 'question', icon: '💬', label: 'Question', color: 'sky2-500' },
  { id: 'geolock', icon: '🔮', label: 'Géo-verrou', color: 'lilac-500' },
  { id: 'story', icon: '📸', label: 'Story', color: 'forest-500' },
] as const;

export default function ComposePage() {
  const [activeType, setActiveType] = useState<string>('sell');

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-ink-700/60">
            ✕ Annuler
          </Link>
          <span className="text-sm font-extrabold">Nouveau post</span>
          <button className="bg-ink-900 text-cream-50 px-4 py-2 rounded-full text-xs font-bold shadow-soft">
            Publier
          </button>
        </header>

        <div className="px-3 lg:px-8 py-4 space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mb-2">
              Type de post
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveType(t.id)}
                  className={clsx(
                    'p-3 rounded-2xl shadow-soft text-center transition',
                    activeType === t.id
                      ? 'bg-white ring-2 ring-sunset-500'
                      : 'bg-white text-ink-700/60',
                  )}
                >
                  <div className="text-2xl">{t.icon}</div>
                  <div
                    className={clsx(
                      'text-[11px] font-bold mt-1',
                      activeType === t.id ? 'text-ink-900' : 'text-ink-700/60',
                    )}
                  >
                    {t.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Photo zone */}
          <div className="bg-gradient-to-br from-sky2-300 to-sky2-500 rounded-3xl aspect-square flex flex-col items-center justify-center text-white shadow-lift">
            <div className="text-7xl">🚲</div>
            <div className="mt-2 font-extrabold">+ Photo / vidéo</div>
            <div className="text-xs opacity-80">tap pour changer</div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-3xl p-4 shadow-soft border border-ink-900/5">
            <input
              defaultValue="VAE 25 km/h état impeccable"
              placeholder="Titre du post…"
              className="w-full text-base font-extrabold pb-2 border-b border-ink-900/8 outline-none bg-transparent"
            />
            <textarea
              defaultValue="Batterie neuve, facture 2024. À venir chercher rue Sedaine."
              placeholder="Décris ton objet…"
              className="w-full mt-3 text-sm outline-none bg-transparent resize-none min-h-[80px]"
            />
            <div className="flex items-center gap-2 pt-3 border-t border-ink-900/6">
              <span className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50">PRIX</span>
              <input
                defaultValue="899"
                className="text-2xl font-black w-24 outline-none bg-transparent"
              />
              <span className="text-2xl font-black">€</span>
            </div>
          </div>

          {/* Visibility */}
          <div className="bg-gradient-to-br from-cream-50 to-sand-100 rounded-3xl p-4 flex items-center gap-3 border border-ink-900/5">
            <div className="w-10 h-10 rounded-xl bg-forest-500 text-white flex items-center justify-center text-base">
              📍
            </div>
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50">
                Visibilité
              </div>
              <div className="text-sm font-extrabold">Aura · 500m</div>
            </div>
            <button className="text-xs font-bold text-forest-600">Modifier ▸</button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
